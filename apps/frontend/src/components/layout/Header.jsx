import React from 'react';
import { ShoppingCart, Cpu, RefreshCw, Layers, History, LayoutGrid, Terminal } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export default function Header({
  backendStatus,
  onRetryHealth,
  activeTab,
  setActiveTab,
  cartCount,
  cartSubtotal,
  onOpenCart
}) {
  return (
    <header className="header-shell">
      <div className="header-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1280px', margin: '0 auto', height: '64px' }}>
        
        {/* Brand/Logo Section */}
        <div className="logo-container">
          <button className="logo-link" onClick={() => setActiveTab('products')}>
            <Cpu size={16} className="text-primary" />
            <h1 className="brand-title">hybridcloud</h1>
          </button>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="tab-group">
          <button 
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <LayoutGrid size={14} />
            <span>Catalog</span>
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <History size={14} />
            <span>My Orders</span>
          </button>

          <button 
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <Terminal size={14} />
            <span>Admin</span>
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Layers size={14} />
            <span>DevOps</span>
          </button>
        </nav>

        {/* Status Indicators & Cart Trigger */}
        <div className="action-group">
          {/* Health Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={`connection-status-pill ${backendStatus === 'offline' ? 'offline' : ''}`}>
              <span className="status-dot"></span>
              <span>Backend: {backendStatus === 'checking' ? 'SYNCING' : backendStatus.toUpperCase()}</span>
              <button 
                onClick={onRetryHealth}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                title="Retry Connection"
                disabled={backendStatus === 'checking'}
              >
                <RefreshCw 
                  size={10} 
                  className={backendStatus === 'checking' ? 'animate-spin' : ''} 
                />
              </button>
            </div>
            
            <div className="connection-status-pill">
              <span className="status-dot"></span>
              <span>SAM ACTIVE</span>
            </div>
          </div>

          {/* Cart Drawer Trigger */}
          <button className="cart-indicator-btn" onClick={onOpenCart}>
            <ShoppingCart size={14} />
            <span>Cart</span>
            <span className="cart-badge-count">{cartCount}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }} className="font-mono">{formatPrice(cartSubtotal)}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
