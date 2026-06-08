import React from 'react';
import { Search, SlidersHorizontal, PackageOpen } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductList({
  products,
  loading,
  categories,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  onAddToCart,
  onViewDetails
}) {
  return (
    <div className="product-list-section">
      
      {/* Search & Sort Panel */}
      <div className="filter-row" style={{ marginBottom: '20px' }}>
        
        {/* Search Field */}
        <div className="search-bar-shell">
          <Search size={16} className="search-icon" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Search products, descriptions, specs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
          <SlidersHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sort by:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-selector"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Alphabetical: A-Z</option>
            <option value="name-desc">Alphabetical: Z-A</option>
          </select>
        </div>

      </div>

      {/* Category Chips Bar */}
      <div className="category-chip-group" style={{ marginBottom: '24px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Catalog Status Info */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        <span>Showing <strong className="text-primary">{products.length}</strong> products</span>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div className="animate-spin" style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
          <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Syncing product database...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
          <PackageOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No products match search criteria</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>Try resetting filters, adjusting query strings, or adding new items via the Admin Panel.</p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            className="btn btn-secondary"
            style={{ marginTop: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="products-grid-catalog">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}

    </div>
  );
}
