const orderRepository = require('../repositories/order.repository');
const orderEmitter = require('../events/order.emitter');

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
}

module.exports = new OrderService();
