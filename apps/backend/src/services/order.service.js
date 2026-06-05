const orderRepository = require('../repositories/order.repository');
const orderEmitter = require('../events/order.emitter');
const { VerifyEmailIdentityCommand } = require('@aws-sdk/client-ses');
const { sesClient, useLocalMock } = require('../config/aws');

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
      console.log(`[Local Mock] Simulated sending SES verification email to: ${email}`);
      return { success: true, message: `Mock: Verification email sent to ${email}` };
    }

    try {
      console.log(`[SES Service] Sending verification request for email: ${email}`);
      const command = new VerifyEmailIdentityCommand({ EmailAddress: email });
      await sesClient.send(command);
      return { success: true, message: `Verification email sent to ${email}. Please check your inbox/spam folder.` };
    } catch (error) {
      console.error('[SES Service] Error requesting verification:', error);
      throw new Error(`AWS SES Error: ${error.message}`);
    }
  }
}

module.exports = new OrderService();
