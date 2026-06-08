const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const { verifyPassword, hashPassword } = require('../utils/hash');
const { snsClient, useLocalMock } = require('../config/aws');
const { SubscribeCommand, ListSubscriptionsByTopicCommand } = require('@aws-sdk/client-sns');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldev123!';

class AuthController {
  async register(req, res, next) {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }

      // Validate role
      const userRole = (role === 'admin' || role === 'user') ? role : 'user';

      // Check existing username
      const existingUser = await userRepository.getByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }

      // Check existing email
      const existingEmail = await userRepository.getByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email is already registered' });
      }

      // Hash password
      const { salt, hash } = hashPassword(password);

      // Create user
      const user = await userRepository.create({
        username,
        email,
        passwordHash: hash,
        salt,
        role: userRole,
        status: 'PendingVerification'
      });

      // SNS email confirmation dispatch
      let snsError = false;
      const topicArn = process.env.EMAIL_NOTIFICATION_TOPIC_ARN;
      
      if (!useLocalMock && topicArn) {
        try {
          const command = new SubscribeCommand({
            TopicArn: topicArn,
            Protocol: 'email',
            Endpoint: email,
            Attributes: {
              FilterPolicy: JSON.stringify({ email: [email] })
            }
          });
          await snsClient.send(command);
          console.log(`[SNS] Subscribed ${email} to ${topicArn}`);
        } catch (err) {
          console.error('[SNS Subscription Error]', err);
          snsError = true;
        }
      }

      return res.status(201).json({
        message: 'Registration successful! Verification email sent via SNS.',
        username: user.username,
        email: user.email,
        status: user.status,
        snsSimulated: useLocalMock,
        snsError
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyRegistration(req, res, next) {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const user = await userRepository.getByUsername(username);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.status === 'Active') {
        return res.status(200).json({ message: 'User is already active', status: 'Active' });
      }

      // Mock auto-confirms or handles locally
      if (useLocalMock) {
        const updatedUser = await userRepository.updateStatus(user.id, 'Active');
        return res.status(200).json({
          message: 'Account verified successfully (Mock Mode)!',
          status: updatedUser.status
        });
      }

      const topicArn = process.env.EMAIL_NOTIFICATION_TOPIC_ARN;
      if (!topicArn) {
        // Fallback if topic is missing in config
        const updatedUser = await userRepository.updateStatus(user.id, 'Active');
        return res.status(200).json({
          message: 'Account verified successfully (Topic Config Missing Fallback)!',
          status: updatedUser.status
        });
      }

      // Query active SNS subscriptions to check confirmation
      try {
        const command = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn });
        const response = await snsClient.send(command);
        const subscriptions = response.Subscriptions || [];

        const userSub = subscriptions.find(s => s.Endpoint === user.email);

        if (!userSub) {
          // Re-subscribe if not found
          const subCommand = new SubscribeCommand({
            TopicArn: topicArn,
            Protocol: 'email',
            Endpoint: user.email,
            Attributes: {
              FilterPolicy: JSON.stringify({ email: [user.email] })
            }
          });
          await snsClient.send(subCommand);
          return res.status(400).json({
            error: 'Subscription not found. We have sent another subscription verification email. Please confirm it in your inbox first.'
          });
        }

        if (userSub.SubscriptionArn === 'PendingConfirmation') {
          return res.status(400).json({
            error: 'Verification pending. Please check your inbox and click the AWS SNS confirmation link first.'
          });
        }

        // Confirmed!
        const updatedUser = await userRepository.updateStatus(user.id, 'Active');
        return res.status(200).json({
          message: 'Account verified and activated successfully!',
          status: updatedUser.status
        });
      } catch (err) {
        console.error('[SNS Subscription Verification Error]', err);
        return res.status(500).json({ error: 'Failed to inspect AWS SNS subscriptions' });
      }
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await userRepository.getByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check verification status
      if (user.status !== 'Active') {
        return res.status(403).json({
          error: 'Account pending verification. Please verify your email first.',
          status: user.status
        });
      }

      // Check password
      const isValid = verifyPassword(password, user.salt, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        token,
        username: user.username,
        email: user.email,
        role: user.role,
        expiresIn: '24h'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
