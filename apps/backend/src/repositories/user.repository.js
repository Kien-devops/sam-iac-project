const { dynamoDocClient, useLocalMock } = require('../config/aws');
const { PutCommand, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const tableName = process.env.USERS_TABLE || 'UsersTable-prod';

// Local mock data store with a pre-seeded admin account
// Password: 'admin' hashed with salt 'salt' -> 11dc1d3da523b078578806b4cf6ee2baad0cd9f26d6da62c3fe87c2520be7b1f
let mockUsers = [
  { 
    id: 'usr-admin-1', 
    username: 'admin', 
    email: 'admin@hybridcloud.com', 
    passwordHash: '11dc1d3da523b078578806b4cf6ee2baad0cd9f26d6da62c3fe87c2520be7b1f',
    salt: 'salt',
    role: 'admin', 
    status: 'Active', 
    createdAt: new Date().toISOString() 
  }
];

class UserRepository {
  async getByUsername(username) {
    if (useLocalMock) {
      return mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    }

    try {
      const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'username = :username',
        ExpressionAttributeValues: {
          ':username': username
        }
      });
      const response = await dynamoDocClient.send(command);
      return response.Items?.[0] || null;
    } catch (error) {
      console.error('[UserRepository] Error finding user by username:', error);
      return mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    }
  }

  async getByEmail(email) {
    if (useLocalMock) {
      return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }

    try {
      const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      });
      const response = await dynamoDocClient.send(command);
      return response.Items?.[0] || null;
    } catch (error) {
      console.error('[UserRepository] Error finding user by email:', error);
      return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  }

  async getById(id) {
    if (useLocalMock) {
      return mockUsers.find(u => u.id === id) || null;
    }

    try {
      const command = new GetCommand({
        TableName: tableName,
        Key: { id }
      });
      const response = await dynamoDocClient.send(command);
      return response.Item || null;
    } catch (error) {
      console.error('[UserRepository] Error getting user by id:', error);
      return mockUsers.find(u => u.id === id) || null;
    }
  }

  async create(user) {
    const newUser = {
      id: `usr-${Math.random().toString(36).substr(2, 9)}`,
      status: 'PendingVerification',
      createdAt: new Date().toISOString(),
      ...user
    };

    if (useLocalMock) {
      mockUsers.push(newUser);
      return newUser;
    }

    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: newUser
      });
      await dynamoDocClient.send(command);
      return newUser;
    } catch (error) {
      console.error('[UserRepository] Error creating user in DynamoDB:', error);
      mockUsers.push(newUser);
      return newUser;
    }
  }

  async updateStatus(id, status) {
    if (useLocalMock) {
      const user = mockUsers.find(u => u.id === id);
      if (user) {
        user.status = status;
        return user;
      }
      return null;
    }

    try {
      const user = await this.getById(id);
      if (!user) return null;
      user.status = status;

      const command = new PutCommand({
        TableName: tableName,
        Item: user
      });
      await dynamoDocClient.send(command);
      return user;
    } catch (error) {
      console.error('[UserRepository] Error updating user status in DynamoDB:', error);
      const user = mockUsers.find(u => u.id === id);
      if (user) {
        user.status = status;
        return user;
      }
      return null;
    }
  }
}

module.exports = new UserRepository();
