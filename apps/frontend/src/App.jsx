import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  Cpu, 
  Layers, 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Mail, 
  DollarSign, 
  Clock 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [customerEmail, setCustomerEmail] = useState('kien_test_sns@mailinator.com');
  
  // Form states
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Electronics', description: '' });
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [message, setMessage] = useState(null);

  // Load initial products and orders
  useEffect(() => {
    checkHealth();
    fetchProducts();
    fetchOrders();
  }, []);

  const checkHealth = async () => {
    try {
      setBackendStatus('checking');
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      if (response.status === 200) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.warn("Backend products fetch failed. Falling back to local mock products.");
      setProducts([
        { id: '1', name: 'MacBook Pro M3 Max', price: 3499, category: 'Electronics', description: 'Apple Silicon supercharged laptop for developers.' },
        { id: '2', name: 'Sony WH-1000XM5', price: 399, category: 'Electronics', description: 'Industry-leading noise-canceling wireless headphones.' },
        { id: '3', name: 'Logitech MX Master 3S', price: 99, category: 'Accessories', description: 'Ergonomic precision mouse optimized for developers.' }
      ]);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders`);
      setOrders(response.data);
    } catch (error) {
      console.warn("Backend orders fetch failed. Falling back to local mock orders.");
      setOrders([
        { id: 'ORD-98231', items: [{ productId: '1', name: 'MacBook Pro M3 Max', price: 3499, quantity: 1 }], total: 3499, status: 'Completed', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 'ORD-12845', items: [{ productId: '3', name: 'Logitech MX Master 3S', price: 99, quantity: 2 }], total: 198, status: 'Processing', createdAt: new Date().toISOString() }
      ]);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    setLoadingProduct(true);
    try {
      const payload = { ...newProduct, price: parseFloat(newProduct.price) };
      let response;
      if (backendStatus === 'online') {
        response = await axios.post(`${API_BASE_URL}/api/products`, payload);
        setProducts(prev => [response.data, ...prev]);
      } else {
        // Mock creation
        const mockProduct = {
          id: Math.random().toString(36).substr(2, 9),
          ...payload
        };
        setProducts(prev => [mockProduct, ...prev]);
      }
      setNewProduct({ name: '', price: '', category: 'Electronics', description: '' });
      showNotification('success', 'Product created successfully!');
    } catch (error) {
      showNotification('error', 'Failed to create product.');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleBuyProduct = async (product) => {
    if (!customerEmail || !customerEmail.trim() || !customerEmail.includes('@')) {
      showNotification('error', 'Please enter a valid email address in the "Customer Notification Email" field.');
      return;
    }
    const email = customerEmail.trim();

    setLoadingOrder(true);
    try {
      const payload = {
        email,
        items: [
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
          }
        ]
      };
      
      let response;
      if (backendStatus === 'online') {
        response = await axios.post(`${API_BASE_URL}/api/orders`, payload);
        setOrders(prev => [response.data, ...prev]);
        showNotification('success', `Order placed successfully! SNS subscription requested.`);
      } else {
        // Mock order placement
        const mockOrder = {
          id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
          items: payload.items,
          total: product.price,
          status: 'Processing',
          createdAt: new Date().toISOString(),
          simulated: true
        };
        setOrders(prev => [mockOrder, ...prev]);
        showNotification('warning', `Mock Order placed. Connect ECS Backend to test AWS SNS triggers.`);
      }
      fetchOrders();
    } catch (error) {
      showNotification('error', 'Failed to process checkout.');
    } finally {
      setLoadingOrder(false);
    }
  };

  const showNotification = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner Status */}
      <header style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="gradient-text">Hybrid Cloud E-Commerce</h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ECS Fargate + Serverless SAM Architecture</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Backend Engine:</span>
              <span className={`badge ${backendStatus === 'online' ? 'badge-success' : backendStatus === 'checking' ? 'badge-warning' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: backendStatus === 'online' ? 'var(--accent-emerald)' : backendStatus === 'checking' ? 'var(--accent-amber)' : 'var(--accent-rose)', display: 'inline-block' }}></span>
                {backendStatus.toUpperCase()}
              </span>
              <button onClick={checkHealth} className="btn btn-secondary" style={{ padding: '4px 8px', borderRadius: '6px' }} title="Retry connection">
                <RefreshCw size={12} />
              </button>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              Serverless Stack: <span className="badge badge-success">SAM READY</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }} className="animate-fade-in">
        {/* Floating Notification */}
        {message && (
          <div style={{ 
            position: 'fixed', 
            bottom: '24px', 
            right: '24px', 
            zIndex: 1000, 
            padding: '16px 20px', 
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : message.type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(244, 63, 94, 0.95)',
            color: '#fff',
            backdropFilter: 'blur(8px)'
          }}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span style={{ fontWeight: 500 }}>{message.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '32px', paddingBottom: '2px' }}>
          <button 
            className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('products')}
            style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', padding: '12px 24px' }}
          >
            <Package size={18} /> Products Catalog
          </button>
          <button 
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('orders')}
            style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', padding: '12px 24px' }}
          >
            <ShoppingCart size={18} /> Orders Logs
          </button>
          <button 
            className={`btn ${activeTab === 'system' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('system')}
            style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', padding: '12px 24px' }}
          >
            <Layers size={18} /> Architecture & DevOps
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'products' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              
              {/* Product Creator Form */}
              <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} className="gradient-text" /> Add New Product
                </h3>
                <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Product Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g., Apple iPad Pro"
                      value={newProduct.name}
                      onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Price (USD)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="input-field" 
                        placeholder="Price"
                        value={newProduct.price}
                        onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Category</label>
                      <select 
                        className="input-field"
                        style={{ height: '47px' }}
                        value={newProduct.category}
                        onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Apparel">Apparel</option>
                        <option value="Office">Office</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Description</label>
                    <textarea 
                      className="input-field" 
                      rows="3"
                      placeholder="Short details about the product..."
                      value={newProduct.description}
                      onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loadingProduct}>
                    {loadingProduct ? 'Publishing...' : 'Add to Catalog'}
                  </button>
                </form>
              </div>

              {/* Products Catalog list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} className="gradient-text" /> Active Catalog
                </h3>

                {/* Customer Notification Email Card */}
                <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Mail size={16} className="gradient-text" /> Customer Notification Email
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Enter your email to receive order updates and PDF invoices automatically via AWS SNS and SES.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input 
                      type="email" 
                      className="input-field" 
                      placeholder="e.g., customer@example.com"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
                
                {products.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No products available in the catalog. Add one to start.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    {products.map(product => (
                      <div key={product.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 600 }}>{product.name}</span>
                            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>{product.category}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{product.description}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>${product.price}</span>
                          <button onClick={() => handleBuyProduct(product)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} disabled={loadingOrder}>
                            <ShoppingCart size={14} /> Buy Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} className="gradient-text" /> Event-Driven Orders Log
              </h3>
              <button onClick={fetchOrders} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} /> Sync Logs
              </button>
            </div>
            
            {orders.length === 0 ? (
              <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No orders recorded yet. Return to Products Catalog to place simulated checkout events.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map(order => (
                  <div key={order.id} className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{order.id}</span>
                        {order.simulated && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>SIMULATED LOCAL</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <Clock size={14} /> {new Date(order.createdAt).toLocaleTimeString()}
                        </span>
                        <span className={`badge ${order.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Purchased</h4>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '4px' }}>
                            <span>{item.name} <span style={{ color: 'var(--text-muted)' }}>x {item.quantity}</span></span>
                            <span style={{ fontWeight: 500 }}>${item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '8px', fontWeight: 700 }}>
                          <span>Total Amount</span>
                          <span>${order.total}</span>
                        </div>
                      </div>

                      {/* Event Processing Pipeline visualizer */}
                      <div style={{ background: 'rgba(11, 15, 25, 0.4)', borderRadius: 'var(--radius-md)', padding: '16px', minWidth: '280px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Execution Chain</h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)' }}>1</div>
                            <span style={{ fontSize: '0.85rem' }}>ECS: Order Created (Event published)</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: order.simulated ? 'rgba(100, 116, 139, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: order.simulated ? 'var(--text-muted)' : 'var(--accent-emerald)' }}>2</div>
                            <span style={{ fontSize: '0.85rem', color: order.simulated ? 'var(--text-muted)' : 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Mail size={12} /> Email Confirmation Sent
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: order.simulated ? 'rgba(100, 116, 139, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: order.simulated ? 'var(--text-muted)' : 'var(--accent-emerald)' }}>3</div>
                            <span style={{ fontSize: '0.85rem', color: order.simulated ? 'var(--text-muted)' : 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <FileText size={12} /> Invoice PDF generated (S3 Bucket)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* System & Architecture Tab */}
        {activeTab === 'system' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }} className="gradient-text">
                <Cpu size={24} /> Hybrid ECS Fargate + Serverless SAM Architecture
              </h3>
              
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1rem', lineHeight: '1.6' }}>
                This environment deploys a modern cloud-native system combining high-throughput services with elastic serverless event processors. 
                Below is a logical breakdown of how components route traffic and integrate dynamically.
              </p>

              {/* Graphical Layout (Pure CSS Grid Infrastructure) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(11, 15, 25, 0.5)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                  🌐 User Client (Web Browser)
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>↓</div>

                <div style={{ textAlign: 'center', padding: '12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                  ⚖️ AWS Application Load Balancer (ALB)
                  <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}>Path-Based Routing Rules</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ padding: '16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rules: / or /app/*</div>
                    <h4 style={{ margin: '8px 0', fontSize: '1rem' }} className="gradient-text">📦 ECS Fargate Frontend</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nginx serving built React static resources</p>
                  </div>
                  
                  <div style={{ padding: '16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rules: /api/*</div>
                    <h4 style={{ margin: '8px 0', fontSize: '1rem' }} className="gradient-text">⚙️ ECS Fargate Backend</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Express APIs (Products, Order Execution)</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div></div>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    ↓ publish event
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div></div>
                  <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-emerald)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    📢 Amazon SNS (OrderCreatedTopic)
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div></div>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    ↓ subscription
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div></div>
                  <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--accent-amber)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    📥 Amazon SQS (OrderCreatedQueue)
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div></div>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    ↓ poll events
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🕒 Daily Cron scheduler (EventBridge)
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid var(--secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.8rem' }}>
                      ⚡ Lambda: Send Email
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid var(--secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.8rem' }}>
                      ⚡ Lambda: Make Invoice
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Writes to S3</div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid var(--secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.8rem' }}>
                      ⚡ Lambda: Daily Report
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Writes to DynamoDB</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>ECS Orchestration</h4>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Both applications are fully containerized using independent Docker images.</li>
                    <li>Terraform manages the cluster infrastructure, launch configurations, task execution IAM roles, and target groups.</li>
                    <li>Continuous updates (source code changes) are deployed using native AWS CLI updates without destroying/creating resource templates.</li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Serverless Core</h4>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Managed separately via **AWS SAM**, decoupling compute layer dependencies from long-running service topologies.</li>
                    <li>SNS triggers allow loose coupling: backend does not block waiting for invoicing or email functions to resolve.</li>
                    <li>Dynamic parameters schema configured via JSON payloads per environment (dev, staging, prod).</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '24px', background: 'var(--bg-secondary)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <p>© 2026 Sleek E-Commerce Cloud Platform. Managed with Terraform, AWS SAM, and GitHub Actions.</p>
      </footer>
    </div>
  );
}

export default App;
