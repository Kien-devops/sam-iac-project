import React from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  if (!product) return null;

  const { name, price, category, description, stock } = product;
  const isOutOfStock = stock === 0;

  // Derive specs lists based on category
  const getSpecs = () => {
    if (category === 'Electronics') {
      return [
        { name: 'Core Processor', value: 'Arm-based Octa-core Engine' },
        { name: 'Power Consumption', value: '45W Peak Efficiency' },
        { name: 'Material', value: 'Anodized Recycled Aluminum' },
        { name: 'Compliance', value: 'FCC, CE, RoHS certified' }
      ];
    }
    if (category === 'Accessories') {
      return [
        { name: 'Connectivity', value: 'Low Latency Bluetooth 5.2 / USB-C' },
        { name: 'Battery Runtime', value: 'Up to 70 hours continuous use' },
        { name: 'Customization', value: 'Programmable keys via Web-App API' },
        { name: 'Weight', value: '141 grams' }
      ];
    }
    return [
      { name: 'Warranty Period', value: '1 Year Limited Global Warranty' },
      { name: 'Origin Country', value: 'Designed in CA, assembled globally' },
      { name: 'Dimensions', value: 'Standard architectural specs' },
      { name: 'Shipping Weight', value: 'Varies by packaging selection' }
    ];
  };

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ gap: '24px' }}>
        
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{category}</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{name}</h2>
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

        {/* Drawer Scrollable Content */}
        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '4px' }}>
          {/* Main Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }} className="font-mono">{formatPrice(price)}</span>
            {isOutOfStock ? (
              <span className="card-badge-stock critical">Out of Stock</span>
            ) : (
              <span className="card-badge-stock" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-emerald)' }}>{stock} Units Available</span>
            )}
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{description || 'No additional specifications provided.'}</p>

          {product.tags && product.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {product.tags.map((tag, idx) => (
                <span key={idx} style={{ 
                  fontSize: '0.7rem', 
                  background: 'rgba(79, 70, 229, 0.06)', 
                  color: '#4f46e5', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  border: '1px solid rgba(79, 70, 229, 0.12)',
                  fontWeight: '500'
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Specs Sheet */}
          <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.05em' }}>Technical Specifications</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {getSpecs().map((spec, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: idx < getSpecs().length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{spec.name}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{spec.value}</span>
                </div>
              ))}
            </div>
          </div>


        </div>

        {/* Drawer Footer Actions */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button 
            onClick={() => { onAddToCart(product); onClose(); }} 
            className="btn-cart-add"
            style={{ width: '100%', height: '44px', fontSize: '0.85rem' }}
            disabled={isOutOfStock}
          >
            <ShoppingCart size={16} />
            <span>{isOutOfStock ? 'Out of Stock' : 'Add to Shopping Cart'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
