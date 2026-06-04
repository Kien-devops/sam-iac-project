const orderService = require('../services/order.service');

class OrderController {
  async getOrders(req, res, next) {
    try {
      const orders = await orderService.listOrders();
      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderDetails(req.params.id);
      res.status(200).json(order);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async createOrder(req, res, next) {
    try {
      const order = await orderService.placeOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new OrderController();
