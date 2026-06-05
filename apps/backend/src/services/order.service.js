const orderRepository = require('../repositories/order.repository');
const orderEmitter = require('../events/order.emitter');
const { SubscribeCommand } = require('@aws-sdk/client-sns');
const { snsClient, useLocalMock } = require('../config/aws');

const snsTopicArn = process.env.AWS_SNS_ORDER_CREATED_ARN || process.env.SNS_TOPIC_ARN;

class OrderService {
  async listOrders() {
    return await orderRepository.getAll();
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
      total
    };

    // Save order
    const createdOrder = await orderRepository.create(orderPayload);

    // Emit event asynchronously
    try {
      await orderEmitter.emitOrderCreated(createdOrder);
    } catch (snsError) {
      console.error('[OrderService] Warning: SNS event publish failed but order was saved:', snsError);
    }

    return createdOrder;
  }

  async verifyEmailIdentity(email) {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (useLocalMock) {
      console.log(`[Local Mock] Simulated sending SNS subscription invitation to: ${email}`);
      return { success: true, message: `Mock: SNS subscription invitation sent to ${email}` };
    }

    try {
      console.log(`[SNS Service] Subscribing email: ${email} to Topic: ${snsTopicArn}`);
      if (!snsTopicArn) {
        throw new Error('SNS Topic ARN is not configured');
      }

      const command = new SubscribeCommand({
        TopicArn: snsTopicArn,
        Protocol: 'email',
        Endpoint: email,
        Attributes: {
          FilterPolicy: JSON.stringify({
            email: [email]
          })
        }
      });
      await snsClient.send(command);
      return { success: true, message: `Subscription request sent to ${email}. Please check your inbox and click 'Confirm subscription' in the email from AWS.` };
    } catch (error) {
      console.error('[SNS Service] Error subscribing email:', error);
      throw new Error(`AWS SNS Error: ${error.message}`);
    }
  }
}

module.exports = new OrderService();
