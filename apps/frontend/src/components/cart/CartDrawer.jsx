import React from 'react';
import { X, Trash2, Mail, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight, UserCheck } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  getSubtotal,
  getTax,
  getShipping,
  getTotal,
  currentUser,
  onOpenAuth,
  onProceedToCheckout,
  backendStatus
}) {
  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const tax = getTax();
  const shipping = getShipping();
  const total = getTotal();
  const isCartEmpty = cart.length === 0;

  // Checkout is locked if cart is empty or if user is not authenticated
  const isCheckoutLocked = isCartEmpty || !currentUser;

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ gap: '24px' }}>
        
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Shopping Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'all var(--transition-fast)' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '4px' }}>
          
          {/* Email / User Identity Box */}
          <div className="bezel-shell">
            <div className="bezel-core" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-primary)' }}>
                <Mail size={14} style={{ color: 'var(--primary)' }} /> Client Identity
              </h4>

              {currentUser ? (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '6px', padding: '10px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)', marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">{currentUser.email}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Logged in as <strong style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>{currentUser.username} ({currentUser.role})</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center', padding: '8px 0' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    You must be authenticated with a verified DynamoDB account to place checkout orders.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="btn-action-verify"
                    style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <UserCheck size={14} />
                    <span>Sign In or Register</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          {isCartEmpty ? (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 16px' }}>
              <ShoppingBag size={48} style={{ color: 'var(--text-muted)', opacity: 0.2, marginBottom: '16px' }} />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Your cart is empty</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Browse the catalog to add items here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)' }}>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }} className="font-mono">{formatPrice(item.price)}</p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.8rem', padding: '0 8px', color: 'var(--text-primary)', minWidth: '20px', textAlign: 'center' }} className="font-mono">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        +
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="btn-action-delete"
                      title="Remove item"
                      style={{ padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Drawer Footer Price Summary */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span className="font-mono">{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Estimated Tax (8%)</span>
              <span className="font-mono">{formatPrice(tax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Shipping</span>
              <span className="font-mono">{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
              <span>Order Total</span>
              <span className="font-mono" style={{ color: 'var(--primary)' }}>{formatPrice(total)}</span>
            </div>
          </div>

          {/* Checkout Instruction Warnings */}
          {!currentUser && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
              <AlertCircle size={14} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Checkout locked. You must sign in with a verified account to continue.</span>
            </div>
          )}

          <button 
            onClick={onProceedToCheckout} 
            className="btn-cart-add"
            style={{ width: '100%', height: '44px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
            disabled={isCheckoutLocked}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
