const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Apply JWT authentication to all order routes
router.use(verifyToken);

router.get('/', orderController.getOrders);
router.get('/user/purchased', orderController.getUserPurchasedItems);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.post('/:id/pay', orderController.payOrder);
router.get('/:id/invoice', orderController.downloadInvoice);

// Backwards-compatible utility route
router.post('/verify-email', orderController.verifyEmail);

module.exports = router;
