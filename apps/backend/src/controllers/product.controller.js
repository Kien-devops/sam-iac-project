const productService = require('../services/product.service');

class ProductController {
  async getProducts(req, res, next) {
    try {
      const products = await productService.listProducts();
      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.status(200).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const success = await productService.deleteProduct(req.params.id);
      res.status(200).json({ success });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ProductController();

