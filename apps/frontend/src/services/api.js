import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
    username: 'admin',
    customerEmail: 'admin@hybridcloud.com',
    items: [{ productId: '1', name: 'MacBook Pro M3 Max', price: 3499, quantity: 1 }], 
    total: 3499, 
    status: 'Completed', 
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    shipping: { fullName: 'Alex Rivera', address: '101 Cloud Street', city: 'Seattle', phone: '206-555-0199', notes: 'Leave at front desk' }
  }
];

// Seed initial localStorage items if empty
if (!localStorage.getItem('hybrid-local-products')) {
  localStorage.setItem('hybrid-local-products', JSON.stringify(MOCK_PRODUCTS));
}
if (!localStorage.getItem('hybrid-local-orders')) {
  localStorage.setItem('hybrid-local-orders', JSON.stringify(MOCK_ORDERS));
}

// Get JWT Token from LocalStorage for auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('hybrid-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
   * Login user.
   */
  async login(username, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password });
      const { token, role, email } = response.data;
      localStorage.setItem('hybrid-token', token);
      localStorage.setItem('hybrid-username', username);
      localStorage.setItem('hybrid-email', email);
      localStorage.setItem('hybrid-role', role);
      localStorage.setItem('hybrid-status', 'Active');
      return response.data;
    } catch (error) {
      // Mock Fallback
      if (username === 'admin' && password === 'admin') {
        const mockRes = { token: 'mock-jwt-admin-token', username: 'admin', email: 'admin@hybridcloud.com', role: 'admin' };
        localStorage.setItem('hybrid-token', mockRes.token);
        localStorage.setItem('hybrid-username', mockRes.username);
        localStorage.setItem('hybrid-email', mockRes.email);
        localStorage.setItem('hybrid-role', mockRes.role);
        localStorage.setItem('hybrid-status', 'Active');
        return mockRes;
      }
      
      const localUsers = JSON.parse(localStorage.getItem('hybrid-local-users') || '[]');
      const user = localUsers.find(u => u.username === username);
      if (user) {
        if (user.status !== 'Active') {
          throw new Error('Account pending verification. Please verify your email first.');
        }
        // Simplified password matching for mock
        if (password === 'password' || password === username) {
          const mockRes = { token: `mock-jwt-${user.username}`, username: user.username, email: user.email, role: user.role };
          localStorage.setItem('hybrid-token', mockRes.token);
          localStorage.setItem('hybrid-username', mockRes.username);
          localStorage.setItem('hybrid-email', mockRes.email);
          localStorage.setItem('hybrid-role', mockRes.role);
          localStorage.setItem('hybrid-status', 'Active');
          return mockRes;
        }
      }
      
      throw new Error(error.response?.data?.error || 'Invalid credentials');
    }
  },

  /**
   * Register user.
   */
  async register(username, email, password, role = 'user') {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, { username, email, password, role });
      return response.data;
    } catch (error) {
      // Mock Fallback
      const localUsers = JSON.parse(localStorage.getItem('hybrid-local-users') || '[]');
      if (localUsers.find(u => u.username === username || u.email === email)) {
        throw new Error('Username or email already registered');
      }
      const newUser = { username, email, role, status: 'PendingVerification' };
      localUsers.push(newUser);
      localStorage.setItem('hybrid-local-users', JSON.stringify(localUsers));
      return { message: 'Registration successful (Mock)! Verification email sent via SNS.', username, email, status: 'PendingVerification' };
    }
  },

  /**
   * Verify SNS Email Registration.
   */
  async verifyRegistration(username) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-registration`, { username });
      return response.data;
    } catch (error) {
      // Mock Fallback
      const localUsers = JSON.parse(localStorage.getItem('hybrid-local-users') || '[]');
      const user = localUsers.find(u => u.username === username);
      if (user) {
        user.status = 'Active';
        localStorage.setItem('hybrid-local-users', JSON.stringify(localUsers));
        return { message: 'Account verified successfully (Mock Mode)!', status: 'Active' };
      }
      throw new Error(error.response?.data?.error || 'Verification failed');
    }
  },

  /**
   * Logout.
   */
  logout() {
    localStorage.removeItem('hybrid-token');
    localStorage.removeItem('hybrid-username');
    localStorage.removeItem('hybrid-email');
    localStorage.removeItem('hybrid-role');
    localStorage.removeItem('hybrid-status');
  },

  /**
   * Fetch all products.
   * @returns {Promise<Array>}
   */
  async getProducts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.warn("Backend products fetch failed. Reading from local database.");
      return JSON.parse(localStorage.getItem('hybrid-local-products') || '[]');
    }
  },

  /**
   * Create a new product.
   */
  async createProduct(productData) {
    const payload = {
      ...productData,
      stock: parseInt(productData.stock || 10),
      imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/products`, payload, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.warn("Saving product locally due to backend offline status.");
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
   */
  async updateProduct(id, productData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/products/${id}`, productData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      const local = JSON.parse(localStorage.getItem('hybrid-local-products') || '[]');
      const updated = local.map(p => p.id === id ? { ...p, ...productData } : p);
      localStorage.setItem('hybrid-local-products', JSON.stringify(updated));
      return { id, ...productData };
    }
  },

  /**
   * Delete a product.
   */
  async deleteProduct(id) {
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${id}`, {
        headers: getAuthHeaders()
      });
      return true;
    } catch (error) {
      const local = JSON.parse(localStorage.getItem('hybrid-local-products') || '[]');
      const filtered = local.filter(p => p.id !== id);
      localStorage.setItem('hybrid-local-products', JSON.stringify(filtered));
      return true;
    }
  },

  /**
   * Fetch order history.
   */
  async getOrders() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.warn("Backend orders fetch failed. Reading from local logs database.");
      const username = localStorage.getItem('hybrid-username') || 'guest';
      const allOrders = JSON.parse(localStorage.getItem('hybrid-local-orders') || '[]');
      // Filter by username if not admin
      const role = localStorage.getItem('hybrid-role');
      if (role === 'admin') {
        return allOrders;
      }
      return allOrders.filter(o => o.username === username);
    }
  },

  /**
   * Fetch user purchased items list from S3.
   */
  async getUserPurchasedItems() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/user/purchased`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.warn("Backend purchased items fetch failed. Reading from local paid orders.");
      const username = localStorage.getItem('hybrid-username') || 'guest';
      const allOrders = JSON.parse(localStorage.getItem('hybrid-local-orders') || '[]');
      const userOrders = allOrders.filter(o => o.username === username);
      const paidOrders = userOrders.filter(o => o.status === 'Paid' || o.status === 'Completed');
      const purchasedItems = [];
      for (const order of paidOrders) {
        for (const item of order.items) {
          purchasedItems.push({
            id: item.productId || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            purchaseDate: order.createdAt,
            orderId: order.id
          });
        }
      }
      return purchasedItems;
    }
  },

  /**
   * Submit an e-commerce order.
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
      const response = await axios.post(`${API_BASE_URL}/api/orders`, payload, {
        headers: getAuthHeaders()
      });
      return {
        ...response.data,
        shipping: orderData.shipping
      };
    } catch (error) {
      console.warn("Failed to place backend order. Saving to local simulation store.");
      const local = JSON.parse(localStorage.getItem('hybrid-local-orders') || '[]');
      const username = localStorage.getItem('hybrid-username') || 'guest';
      const mockOrder = {
        id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        username,
        customerEmail: orderData.email,
        items: payload.items,
        total: orderData.total,
        status: 'PendingPayment',
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
   * Confirm Payment of an order.
   */
  async payOrder(orderId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/orders/${orderId}/pay`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      const local = JSON.parse(localStorage.getItem('hybrid-local-orders') || '[]');
      const order = local.find(o => o.id === orderId);
      if (order) {
        order.status = 'Paid';
        localStorage.setItem('hybrid-local-orders', JSON.stringify(local));
        return order;
      }
      throw new Error(error.response?.data?.error || 'Payment failed');
    }
  },

  /**
   * Fetch invoice text from S3 bucket.
   */
  async downloadInvoice(orderId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}/invoice`, {
        headers: getAuthHeaders(),
        responseType: 'text'
      });
      return response.data;
    } catch (error) {
      // Mock Fallback invoice construction
      const local = JSON.parse(localStorage.getItem('hybrid-local-orders') || '[]');
      const order = local.find(o => o.id === orderId);
      const itemsText = order ? order.items.map(item => `- ${item.name} | Qty: ${item.quantity} | Price: $${item.price}`).join('\n') : '';
      const totalAmount = order ? order.total : 0;
      
      return `
=========================================
          TAX INVOICE - SIMULATED MOCK (OFFLINE)
=========================================
Invoice Number: INV-${orderId.split('-')[1] || orderId.slice(-6)}
Order ID: ${orderId}
Date: ${new Date().toUTCString()}

Items:
${itemsText}

-----------------------------------------
TOTAL AMOUNT: $${totalAmount}
=========================================
Thank you for buying from our Cloud-Native platform!
`;
    }
  },

  /**
   * Dispatch email verification via AWS SES.
   */
  async verifyEmail(email) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/orders/verify-email`, { email });
      return { success: true, message: response.data.message || 'Verification link sent.' };
    } catch (error) {
      const errMsg = error.response?.data?.error || 'SES sandbox dispatch error.';
      return { success: false, message: errMsg };
    }
  },

  /**
   * Ask the AI Assistant for recommendations or queries.
   */
  async askAIChatbot(message) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/chat`, { message }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      // Mock Fallback
      console.warn("Backend AI chat offline. Simulating response locally.");
      const query = message.toLowerCase();
      const products = JSON.parse(localStorage.getItem('hybrid-local-products') || '[]');
      
      const recommended = [];
      for (const p of products) {
        const matchName = p.name?.toLowerCase().includes(query) || query.includes(p.name?.toLowerCase());
        const matchCategory = p.category?.toLowerCase().includes(query) || query.includes(p.category?.toLowerCase());
        const matchDesc = p.description?.toLowerCase().includes(query);
        const matchTags = Array.isArray(p.tags) && p.tags.some(t => query.includes(t.toLowerCase()) || t.toLowerCase().includes(query));

        if (matchName || matchCategory || matchDesc || matchTags) {
          recommended.push(p);
        }
      }

      let reply = "";
      if (query.includes('hello') || query.includes('hi ') || query.includes('xin chào')) {
        reply = "Hello! I am your AI-powered E-Commerce Assistant. How can I help you find products or track orders today?";
      } else if (recommended.length > 0) {
        reply = `Based on your request, I found ${recommended.length} matching item(s) in our store. Check them out!`;
      } else if (query.includes('order') || query.includes('track') || query.includes('đơn hàng')) {
        reply = "You can view your order processing lifecycle live in the 'Account Dashboard' tab under 'Event Pipeline Log'. State updates are pushed in real time via AWS WebSockets!";
      } else if (query.includes('ship') || query.includes('delivery')) {
        reply = "We offer standard delivery. When you checkout, your items are registered, paid, and tax invoices are automatically generated and archived in S3.";
      } else {
        reply = "I'm not completely sure about that, but here are some popular items in our store that you might like!";
        recommended.push(...products.slice(0, 2));
      }

      return {
        reply,
        products: recommended.slice(0, 3)
      };
    }
  }
};
