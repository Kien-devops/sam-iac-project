import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Service to centralize all backend interactions.
 * If endpoints fail or backend is offline, falls back gracefully to localStorage or mock states.
 */

// Mock lists fallback
const MOCK_PRODUCTS = [
  { 
    id: '1', 
    name: 'MacBook Pro M3 Max', 
    price: 3499, 
    category: 'Electronics', 
    description: 'Apple Silicon supercharged laptop with 16-core CPU, 40-core GPU, and 48GB unified memory.',
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60'
  },
  { 
    id: '2', 
    name: 'Sony WH-1000XM5', 
    price: 399, 
    category: 'Electronics', 
    description: 'Industry-leading noise-canceling wireless over-ear headphones with premium sound quality.',
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60'
  },
  { 
    id: '3', 
    name: 'Logitech MX Master 3S', 
    price: 99, 
    category: 'Accessories', 
    description: 'Ergonomic precision mouse optimized for developers and creative professionals.',
    stock: 4,
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60'
  },
  { 
    id: '4', 
    name: 'Keychron Q1 Pro Keyboard', 
    price: 199, 
    category: 'Accessories', 
    description: 'QMK/VIA wireless custom mechanical keyboard with aluminum body and hot-swappable keys.',
    stock: 0,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60'
  },
  { 
    id: '5', 
    name: 'Premium Leather Desk Mat', 
    price: 49, 
    category: 'Office', 
    description: 'Minimalist double-sided desk blotter made of sustainable cork and vegan leather.',
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1632292224971-0d45778b3002?w=500&auto=format&fit=crop&q=60'
  }
];

const MOCK_ORDERS = [
  { 
    id: 'ORD-98231', 
    customerEmail: 'devops-lead@company.com',
    items: [{ productId: '1', name: 'MacBook Pro M3 Max', price: 3499, quantity: 1 }], 
    total: 3499, 
    status: 'Completed', 
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    shipping: { fullName: 'Alex Rivera', address: '101 Cloud Street', city: 'Seattle', phone: '206-555-0199', notes: 'Leave at front desk' }
  },
  { 
    id: 'ORD-12845', 
    customerEmail: 'frontend-engineer@company.com',
    items: [{ productId: '3', name: 'Logitech MX Master 3S', price: 99, quantity: 2 }], 
    total: 198, 
    status: 'Processing', 
    createdAt: new Date().toISOString(),
    shipping: { fullName: 'Jordan Miller', address: '456 Vpc Lane', city: 'Austin', phone: '512-555-0144', notes: 'Call upon arrival' }
  }
];

// Seed initial localStorage items if empty
if (!localStorage.getItem('hybrid-local-products')) {
  localStorage.setItem('hybrid-local-products', JSON.stringify(MOCK_PRODUCTS));
}
if (!localStorage.getItem('hybrid-local-orders')) {
  localStorage.setItem('hybrid-local-orders', JSON.stringify(MOCK_ORDERS));
}

export const apiService = {
  /**
   * Check if backend service is reachable.
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 3000 });
      return response.status === 200;
    } catch (e) {
      return false;
    }
  },

  /**
   * Fetch all products.
   * @returns {Promise<Array>}
   */
  async getProducts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      // Update local storage representation just in case
      if (Array.isArray(response.data)) {
        // Extend server products with dummy stock if missing
        const synced = response.data.map((p, idx) => ({
          stock: p.stock !== undefined ? p.stock : (10 + (idx * 5) % 25),
          imageUrl: p.imageUrl || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60`,
          ...p
        }));
        return synced;
      }
      return response.data;
    } catch (error) {
      console.warn("Backend products fetch failed. Reading from local database.");
      return JSON.parse(localStorage.getItem('hybrid-local-products') || '[]');
    }
  },

  /**
   * Create a new product.
   * @param {Object} productData 
   * @returns {Promise<Object>}
   */
  async createProduct(productData) {
    // Generate default image URL if empty
    const payload = {
      ...productData,
      stock: parseInt(productData.stock || 10),
      imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'
    };

    try {
      const isOnline = await this.checkHealth();
      if (isOnline) {
        const response = await axios.post(`${API_BASE_URL}/api/products`, payload);
        return { ...payload, ...response.data };
      }
      throw new Error('Offline mode');
    } catch (error) {
      console.warn("Saving product locally due to backend offline status or limitations.");
      const local = JSON.parse(localStorage.getItem('hybrid-local-products') || '[]');
      const newProd = {
        id: `mock-p-${Math.random().toString(36).substr(2, 9)}`,
        ...payload
      };
      local.unshift(newProd);
      localStorage.setItem('hybrid-local-products', JSON.stringify(local));
      return newProd;
    }
  },

  /**
   * Update an existing product.
   * @param {string} id 
   * @param {Object} productData 
   * @returns {Promise<Object>}
   */
  async updateProduct(id, productData) {
    try {
      // If endpoint exists on backend, we could call:
      // const response = await axios.put(`${API_BASE_URL}/api/products/${id}`, productData);
      // However, we simulate updates locally first so as to not break Express APIs
      const local = JSON.parse(localStorage.getItem('hybrid-local-products') || '[]');
      const updated = local.map(p => p.id === id ? { ...p, ...productData } : p);
      localStorage.setItem('hybrid-local-products', JSON.stringify(updated));
      return { id, ...productData };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a product.
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  async deleteProduct(id) {
    try {
      // Simulating deletion locally
      const local = JSON.parse(localStorage.getItem('hybrid-local-products') || '[]');
      const filtered = local.filter(p => p.id !== id);
      localStorage.setItem('hybrid-local-products', JSON.stringify(filtered));
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Fetch order history.
   * @returns {Promise<Array>}
   */
  async getOrders() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.warn("Backend orders fetch failed. Reading from local logs database.");
      return JSON.parse(localStorage.getItem('hybrid-local-orders') || '[]');
    }
  },

  /**
   * Submit an e-commerce order.
   * @param {Object} orderData 
   * @returns {Promise<Object>}
   */
  async createOrder(orderData) {
    const payload = {
      email: orderData.email,
      items: orderData.items.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/orders`, payload);
      // Successfully pushed to SNS/SQS event stream.
      return {
        ...response.data,
        shipping: orderData.shipping,
        status: 'Processing'
      };
    } catch (error) {
      console.warn("Failed to place backend order. Saving to local simulation store.");
      const local = JSON.parse(localStorage.getItem('hybrid-local-orders') || '[]');
      const mockOrder = {
        id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        customerEmail: orderData.email,
        items: payload.items,
        total: orderData.total,
        status: 'Processing',
        createdAt: new Date().toISOString(),
        simulated: true,
        shipping: orderData.shipping
      };
      local.unshift(mockOrder);
      localStorage.setItem('hybrid-local-orders', JSON.stringify(local));
      return mockOrder;
    }
  },

  /**
   * Dispatch email verification via AWS SES.
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  async verifyEmail(email) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/orders/verify-email`, { email });
      return { success: true, message: response.data.message || 'Verification link sent.' };
    } catch (error) {
      const errMsg = error.response?.data?.error || 'SES sandbox dispatch error.';
      return { success: false, message: errMsg };
    }
  }
};
