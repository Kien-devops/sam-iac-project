const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldev123!';

class AuthController {
  login(req, res, next) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Mock validation
    if (username === 'admin' && password === 'admin') {
      const token = jwt.sign(
        { username, role: 'admin' }, 
        JWT_SECRET, 
        { expiresIn: '2h' }
      );
      return res.status(200).json({
        token,
        role: 'admin',
        expiresIn: '2h'
      });
    }

    return res.status(401).json({ error: 'Invalid credentials. Use admin/admin' });
  }
}

module.exports = new AuthController();
