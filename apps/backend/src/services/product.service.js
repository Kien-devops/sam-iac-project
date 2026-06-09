const productRepository = require('../repositories/product.repository');

class ProductService {
  async listProducts() {
    return await productRepository.getAll();
  }

  generateMockTags(productData) {
    const tags = new Set();
    const text = `${productData.name || ''} ${productData.category || ''} ${productData.description || ''}`.toLowerCase();
    
    if (text.includes('macbook') || text.includes('laptop') || text.includes('computer') || text.includes('m3')) {
      tags.add('Computer').add('Laptop').add('Electronics');
    }
    if (text.includes('headphones') || text.includes('sony') || text.includes('audio') || text.includes('wh-1000xm5')) {
      tags.add('Audio').add('Headphones').add('Premium');
    }
    if (text.includes('mouse') || text.includes('logitech') || text.includes('mx master')) {
      tags.add('Accessories').add('Mouse').add('Office');
    }
    if (text.includes('keyboard') || text.includes('keychron') || text.includes('mechanical')) {
      tags.add('Accessories').add('Keyboard').add('Mechanical');
    }
    if (text.includes('desk') || text.includes('mat') || text.includes('leather') || text.includes('office')) {
      tags.add('Office').add('Minimalist').add('Desk Mat');
    }
    
    if (productData.category) {
      tags.add(productData.category);
    }
    
    return Array.from(tags);
  }

  async createProduct(productData) {
    if (!productData.name || typeof productData.price !== 'number' || productData.price <= 0) {
      throw new Error('Invalid product name or price');
    }
    if (!productData.tags || productData.tags.length === 0) {
      productData.tags = this.generateMockTags(productData);
    }
    return await productRepository.create(productData);
  }

  async updateProduct(id, productData) {
    if (!productData.name || typeof productData.price !== 'number' || productData.price <= 0) {
      throw new Error('Invalid product name or price');
    }
    if (!productData.tags || productData.tags.length === 0) {
      productData.tags = this.generateMockTags(productData);
    }
    return await productRepository.update(id, productData);
  }

  async deleteProduct(id) {
    return await productRepository.delete(id);
  }
}

module.exports = new ProductService();

