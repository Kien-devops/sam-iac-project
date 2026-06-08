const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.get('/', productController.getProducts);

// Admin-only operations
router.post('/', verifyToken, requireRole(['admin']), productController.createProduct);
router.put('/:id', verifyToken, requireRole(['admin']), productController.updateProduct);
router.delete('/:id', verifyToken, requireRole(['admin']), productController.deleteProduct);

module.exports = router;
