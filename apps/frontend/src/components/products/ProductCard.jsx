import React from 'react';
import { ShoppingCart, Eye, Package } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export default function ProductCard({ product, onAddToCart, onViewDetails }) {
  const { name, price, category, description, stock } = product;
  
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 5;

  const getProductImage = () => {
    if (product.imageUrl) return product.imageUrl;
    
    // Fallback images from Unsplash
    const images = {
      electronics: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
      accessories: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60',
      apparel: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60',
      office: 'https://images.unsplash.com/photo-1632292224971-0d45778b3002?w=500&auto=format&fit=crop&q=60'
    };
    
    const catKey = String(category || '').toLowerCase();
    return images[catKey] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60';
  };

  return (
    <div className={`bezel-shell animate-fade-in ${isOutOfStock ? 'opacity-75' : ''}`}>
      <div className="bezel-core" style={{ padding: '16px', height: '100%' }}>
        <div className="product-card-wrap">
          
          {/* Image & Badges wrapper */}
          <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '180px', marginBottom: '14px', backgroundColor: 'var(--bg-tertiary)' }}>
            <img 
              src={getProductImage()} 
              alt={name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform var(--transition-normal)' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              loading="lazy"
            />
            
            {/* Category tag */}
            <span style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', backgroundColor: 'rgba(10, 11, 14, 0.75)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', backdropFilter: 'blur(4px)' }}>
              {category}
            </span>

            {/* Stock status overlay */}
            <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
              {isOutOfStock ? (
                <span className="card-badge-stock critical">Sold Out</span>
              ) : isLowStock ? (
                <span className="card-badge-stock warning">Only {stock} Left</span>
              ) : (
                <span className="card-badge-stock" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-emerald)' }}>In Stock</span>
              )}
            </div>
          </div>

          {/* Card Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {description || 'Premium cloud-engineered product. Built for standard reliability.'}
            </p>
            {stock > 0 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }} className="font-mono">
                <Package size={12} />
                <span>{stock} units in inventory</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="product-card-footer">
            <span className="product-price-lbl">{formatPrice(price)}</span>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={() => onViewDetails(product)}
                className="btn-detail-drawer"
                title="View Details"
              >
                <Eye size={14} />
              </button>
              
              <button 
                onClick={() => onAddToCart(product)}
                className="btn-cart-add"
                disabled={isOutOfStock}
              >
                <ShoppingCart size={14} />
                <span>Add</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
