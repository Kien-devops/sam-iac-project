const orderService = require('../services/order.service');

class OrderController {
  async getOrders(req, res, next) {
    try {
      const { username, role } = req.user;
      const orders = await orderService.listOrdersForUser(username, role);
      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderDetails(req.params.id);
      
      // Verify ownership
      if (req.user.role !== 'admin' && order.username !== req.user.username) {
        return res.status(403).json({ error: 'Access denied to this order' });
      }

      res.status(200).json(order);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async createOrder(req, res, next) {
    try {
      // Injected from verifyToken middleware
      const { username, email } = req.user;

      const orderPayload = {
        ...req.body,
        username,
        email
      };

      const order = await orderService.placeOrder(orderPayload);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async payOrder(req, res, next) {
    try {
      const orderId = req.params.id;
      const order = await orderService.getOrderDetails(orderId);

      // Verify ownership
      if (req.user.role !== 'admin' && order.username !== req.user.username) {
        return res.status(403).json({ error: 'Access denied to pay this order' });
      }

      const updated = await orderService.payOrder(orderId);
      res.status(200).json(updated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async downloadInvoice(req, res, next) {
    try {
      const orderId = req.params.id;
      const order = await orderService.getOrderDetails(orderId);

      // Verify ownership
      if (req.user.role !== 'admin' && order.username !== req.user.username) {
        return res.status(403).json({ error: 'Access denied to this order invoice' });
      }

      const content = await orderService.getInvoice(orderId);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.txt`);
      return res.send(content);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { email } = req.body;
      const result = await orderService.verifyEmailIdentity(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUserPurchasedItems(req, res, next) {
    try {
      const { email, username } = req.user;
      const items = await orderService.getUserPurchasedItems(email, username);
      res.status(200).json(items);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
