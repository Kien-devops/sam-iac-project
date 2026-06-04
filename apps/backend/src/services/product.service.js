const productRepository = require('../repositories/product.repository');

class ProductService {
  async listProducts() {
    return await productRepository.getAll();
  }

  async createProduct(productData) {
    if (!productData.name || typeof productData.price !== 'number' || productData.price <= 0) {
      throw new Error('Invalid product name or price');
    }
    return await productRepository.create(productData);
  }
}

module.exports = new ProductService();
