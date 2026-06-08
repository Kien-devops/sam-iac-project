const { dynamoDocClient, useLocalMock } = require('../config/aws');
const { PutCommand, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const tableName = process.env.ORDERS_TABLE || process.env.DYNAMODB_ORDERS_TABLE || 'OrdersTable-prod';

// Local mock data store
let mockOrders = [
  { id: 'ORD-98231', username: 'admin', items: [{ productId: '1', name: 'MacBook Pro M3 Max', price: 3499, quantity: 1 }], total: 3499, status: 'Completed', createdAt: new Date(Date.now() - 3600000).toISOString() }
];

class OrderRepository {
  async getAll() {
    if (useLocalMock) {
      return mockOrders;
    }
    
    try {
      const command = new ScanCommand({ TableName: tableName });
      const response = await dynamoDocClient.send(command);
      return response.Items || [];
    } catch (error) {
      console.error('[OrderRepository] Error scanning DynamoDB:', error);
      return mockOrders;
    }
  }

  async getByUsername(username) {
    if (useLocalMock) {
      return mockOrders.filter(o => o.username === username);
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
      return response.Items || [];
    } catch (error) {
      console.error('[OrderRepository] Error filtering orders in DynamoDB:', error);
      return mockOrders.filter(o => o.username === username);
    }
  }

  async getById(id) {
    if (useLocalMock) {
      return mockOrders.find(o => o.id === id) || null;
    }

    try {
      const command = new GetCommand({
        TableName: tableName,
        Key: { id }
      });
      const response = await dynamoDocClient.send(command);
      return response.Item || null;
    } catch (error) {
      console.error('[OrderRepository] Error getting order from DynamoDB:', error);
      return mockOrders.find(o => o.id === id) || null;
    }
  }

  async create(order) {
    const newOrder = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      status: order.status || 'PendingPayment',
      createdAt: new Date().toISOString(),
      ...order
    };

    if (useLocalMock) {
      mockOrders.unshift(newOrder);
      return newOrder;
    }

    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: newOrder
      });
      await dynamoDocClient.send(command);
      return newOrder;
    } catch (error) {
      console.error('[OrderRepository] Error writing order to DynamoDB:', error);
      mockOrders.unshift(newOrder);
      return newOrder;
    }
  }

  async updateStatus(id, status) {
    if (useLocalMock) {
      const order = mockOrders.find(o => o.id === id);
      if (order) {
        order.status = status;
        return order;
      }
      return null;
    }
    try {
      const order = await this.getById(id);
      if (!order) return null;
      order.status = status;
      const command = new PutCommand({
        TableName: tableName,
        Item: order
      });
      await dynamoDocClient.send(command);
      return order;
    } catch (error) {
      console.error('[OrderRepository] Error updating order status in DynamoDB:', error);
      const order = mockOrders.find(o => o.id === id);
      if (order) {
        order.status = status;
        return order;
      }
      return null;
    }
  }
}

module.exports = new OrderRepository();

