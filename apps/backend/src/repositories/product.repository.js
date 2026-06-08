const { dynamoDocClient, useLocalMock } = require('../config/aws');
const { PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const tableName = process.env.PRODUCTS_TABLE || process.env.DYNAMODB_PRODUCTS_TABLE || 'ProductsTable-prod';

// Local mock data store
let mockProducts = [
  { id: '1', name: 'MacBook Pro M3 Max', price: 3499, category: 'Electronics', description: 'Apple Silicon supercharged laptop for developers.' },
  { id: '2', name: 'Sony WH-1000XM5', price: 399, category: 'Electronics', description: 'Industry-leading noise-canceling wireless headphones.' },
  { id: '3', name: 'Logitech MX Master 3S', price: 99, category: 'Accessories', description: 'Ergonomic precision mouse optimized for developers.' }
];

class ProductRepository {
  async getAll() {
    if (useLocalMock) {
      return mockProducts;
    }
    
    try {
      const command = new ScanCommand({ TableName: tableName });
      const response = await dynamoDocClient.send(command);
      return response.Items || [];
    } catch (error) {
      console.error('[ProductRepository] Error scanning DynamoDB:', error);
      // Fallback in case table doesn't exist yet
      return mockProducts;
    }
  }

  async create(product) {
    const newProduct = {
      id: Math.random().toString(36).substr(2, 9),
      ...product
    };

    if (useLocalMock) {
      mockProducts.push(newProduct);
      return newProduct;
    }

    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: newProduct
      });
      await dynamoDocClient.send(command);
      return newProduct;
    } catch (error) {
      console.error('[ProductRepository] Error writing to DynamoDB:', error);
      mockProducts.push(newProduct);
      return newProduct;
    }
  }

  async update(id, productData) {
    const updatedProduct = { id, ...productData };
    if (useLocalMock) {
      mockProducts = mockProducts.map(p => p.id === id ? updatedProduct : p);
      return updatedProduct;
    }
    try {
      const { PutCommand } = require('@aws-sdk/lib-dynamodb');
      const command = new PutCommand({
        TableName: tableName,
        Item: updatedProduct
      });
      await dynamoDocClient.send(command);
      return updatedProduct;
    } catch (error) {
      console.error('[ProductRepository] Error updating in DynamoDB:', error);
      mockProducts = mockProducts.map(p => p.id === id ? updatedProduct : p);
      return updatedProduct;
    }
  }

  async delete(id) {
    if (useLocalMock) {
      mockProducts = mockProducts.filter(p => p.id !== id);
      return true;
    }
    try {
      const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
      const command = new DeleteCommand({
        TableName: tableName,
        Key: { id }
      });
      await dynamoDocClient.send(command);
      return true;
    } catch (error) {
      console.error('[ProductRepository] Error deleting from DynamoDB:', error);
      mockProducts = mockProducts.filter(p => p.id !== id);
      return true;
    }
  }
}

module.exports = new ProductRepository();

