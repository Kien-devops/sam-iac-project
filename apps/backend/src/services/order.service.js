const orderRepository = require('../repositories/order.repository');
const orderEmitter = require('../events/order.emitter');
const { SubscribeCommand } = require('@aws-sdk/client-sns');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { snsClient, s3Client, useLocalMock } = require('../config/aws');

const emailTopicArn = process.env.EMAIL_NOTIFICATION_TOPIC_ARN;
const invoiceBucketName = process.env.INVOICE_BUCKET;

class OrderService {
  async listOrders() {
    return await orderRepository.getAll();
  }

  async listOrdersForUser(username, role) {
    if (role === 'admin') {
      return await orderRepository.getAll();
    }
    return await orderRepository.getByUsername(username);
  }

  async getOrderDetails(id) {
    const order = await orderRepository.getById(id);
    if (!order) {
      const error = new Error('Order not found');
      error.status = 404;
      throw error;
    }
    return order;
  }

  async placeOrder(orderData) {
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Order items are required');
    }

    // Calculate total
    const total = orderData.items.reduce((acc, item) => {
      if (!item.price || !item.quantity) throw new Error('Item price and quantity are required');
      return acc + (item.price * item.quantity);
    }, 0);

    const orderPayload = {
      items: orderData.items,
      email: orderData.email || '',
      username: orderData.username || 'guest',
      status: 'PendingPayment',
      total
    };

    // Save order
    const createdOrder = await orderRepository.create(orderPayload);
    return createdOrder;
  }

  async payOrder(id) {
    const order = await this.getOrderDetails(id);
    
    if (order.status === 'Paid' || order.status === 'Completed') {
      return order;
    }

    const updatedOrder = await orderRepository.updateStatus(id, 'Paid');

    // Emit event asynchronously to trigger invoice creation via lambda
    try {
      await orderEmitter.emitOrderCreated(updatedOrder);
    } catch (snsError) {
      console.error('[OrderService] Warning: SNS event publish failed but order status was updated to Paid:', snsError);
    }

    return updatedOrder;
  }

  async getInvoice(orderId) {
    const order = await this.getOrderDetails(orderId);
    
    if (order.status !== 'Paid' && order.status !== 'Completed') {
      throw new Error('Order is not paid yet');
    }

    const key = `invoices/${orderId}.txt`;

    if (useLocalMock || !invoiceBucketName) {
      console.log('[Local Mock] Fetching simulated invoice content for order:', orderId);
      return `
=========================================
          TAX INVOICE - SIMULATED MOCK
=========================================
Invoice Number: INV-${orderId.split('-')[1] || orderId.slice(-6)}
Order ID: ${orderId}
Date: ${new Date(order.createdAt || Date.now()).toUTCString()}

Items:
${(order.items || []).map(item => `- ${item.name} | Qty: ${item.quantity} | Price: $${item.price}`).join('\n')}

-----------------------------------------
TOTAL AMOUNT: $${order.total}
=========================================
Thank you for buying from our Cloud-Native platform!
`;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: invoiceBucketName,
        Key: key
      });
      const s3Response = await s3Client.send(command);
      const bodyContents = await s3Response.Body.transformToString();
      return bodyContents;
    } catch (err) {
      console.error(`[OrderService] Error downloading invoice from S3 key ${key}:`, err);
      throw new Error(`Invoice could not be retrieved from S3: ${err.message}`);
    }
  }

  async verifyEmailIdentity(email) {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (useLocalMock) {
      console.log(`[Local Mock] Simulated SNS subscription for: ${email}`);
      return { success: true, message: `Mock: SNS subscription sent to ${email}` };
    }

    try {
      if (!emailTopicArn) {
        throw new Error('Email Notification Topic ARN is not configured');
      }
      console.log(`[SNS Service] Subscribing email: ${email} to EmailNotificationTopic: ${emailTopicArn}`);
      const command = new SubscribeCommand({
        TopicArn: emailTopicArn,
        Protocol: 'email',
        Endpoint: email,
        Attributes: {
          FilterPolicy: JSON.stringify({ email: [email] })
        }
      });
      await snsClient.send(command);
      return { success: true, message: `Subscription request sent to ${email}. Please check your inbox and click Confirm subscription.` };
    } catch (error) {
      console.error('[SNS Service] Error subscribing email:', error);
      throw new Error(`AWS SNS Error: ${error.message}`);
    }
  }

  async getUserPurchasedItems(email, username) {
    const key = `users/${email || 'guest'}/purchased.json`;
    if (useLocalMock || !invoiceBucketName) {
      const orders = await orderRepository.getByUsername(username);
      const paidOrders = orders.filter(o => o.status === 'Paid' || o.status === 'Completed');
      const purchasedItems = [];
      for (const order of paidOrders) {
        for (const item of order.items) {
          purchasedItems.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            purchaseDate: order.createdAt,
            orderId: order.id
          });
        }
      }
      return purchasedItems;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: invoiceBucketName,
        Key: key
      });
      const s3Response = await s3Client.send(command);
      const bodyContents = await s3Response.Body.transformToString();
      return JSON.parse(bodyContents);
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.code === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return [];
      }
      console.error(`[OrderService] Error downloading user purchased list from S3 key ${key}:`, err);
      const orders = await orderRepository.getByUsername(username);
      const paidOrders = orders.filter(o => o.status === 'Paid' || o.status === 'Completed');
      const purchasedItems = [];
      for (const order of paidOrders) {
        for (const item of order.items) {
          purchasedItems.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            purchaseDate: order.createdAt,
            orderId: order.id
          });
        }
      }
      return purchasedItems;
    }
  }
}

module.exports = new OrderService();
