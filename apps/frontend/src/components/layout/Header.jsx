import React from 'react';
import { ShoppingCart, ShoppingBag, RefreshCw, History, LayoutGrid, Terminal, LogIn, LogOut, User } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import logoImg from '../../assets/shopee_fake_logo.png';

export default function Header({
  backendStatus,
  onRetryHealth,
  activeTab,
  setActiveTab,
  cartCount,
  cartSubtotal,
  onOpenCart,
  currentUser,
  onOpenAuth,
  onLogout
}) {
  return (
    <header className="header-shell">
      <div className="header-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1280px', margin: '0 auto', height: '64px' }}>
        
        {/* Brand/Logo Section */}
        <div className="logo-container">
          <button className="logo-link" onClick={() => setActiveTab('products')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none' }}>
            <img src={logoImg} alt="Shopee Fake" style={{ width: '26px', height: '26px', borderRadius: '4px', objectFit: 'cover' }} />
            <h1 className="brand-title">shopee fake</h1>
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

          {/* Admin console tab is visible to everyone, but will have proper security/messaging inside */}
          <button 
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <Terminal size={14} />
            <span>Admin Panel</span>
          </button>
        </nav>

        {/* Status Indicators & User Auth & Cart Trigger */}
        <div className="action-group">


          {/* Authentication Section */}
          <div className="auth-header-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <User size={14} style={{ color: 'var(--primary)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.username}</span>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: currentUser.role === 'admin' ? 'var(--accent-rose)' : 'var(--text-secondary)', fontWeight: 700 }}>
                    {currentUser.role}
                  </span>
                </div>
                <button 
                  onClick={onLogout}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '6px', padding: '2px' }}
                  title="Sign Out"
                >
                  <LogOut size={13} style={{ hover: { color: 'var(--accent-rose)' } }} />
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="tab-btn" 
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', height: '36px' }}
              >
                <LogIn size={13} />
                <span style={{ fontWeight: 600 }}>Login</span>
              </button>
            )}
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
