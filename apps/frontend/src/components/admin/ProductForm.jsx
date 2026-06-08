import React, { useState } from 'react';
import { Plus, Edit3, Trash2, ShieldAlert, Check, X, Tag } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export default function ProductForm({
  products,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  loadingWrite
}) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    description: '',
    stock: '10',
    imageUrl: ''
  });

  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: 'Electronics',
      description: '',
      stock: '10',
      imageUrl: ''
    });
    setEditingId(null);
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: String(product.price),
      category: product.category || 'Electronics',
      description: product.description || '',
      stock: String(product.stock || 10),
      imageUrl: product.imageUrl || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      description: formData.description,
      stock: parseInt(formData.stock || 10),
      imageUrl: formData.imageUrl
    };

    let success = false;
    if (editingId) {
      success = await onUpdateProduct(editingId, payload);
    } else {
      success = await onCreateProduct(payload);
    }

    if (success) {
      resetForm();
    }
  };

  return (
    <div className="admin-console-grid animate-fade-in">
      
      {/* Left Column: Form Panel */}
      <div className="bezel-shell">
        <div className="bezel-core" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={16} style={{ color: 'var(--primary)' }} />
            {editingId ? 'Edit Product Details' : 'Add New Product'}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="input-label">Product Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Mechanical Keyboard"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="input-label">Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="99.99"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="input-label">Category</label>
                <select
                  className="input-field"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{ height: '39px', padding: '8px 12px' }}
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Office">Office</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="input-label">Stock Units</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="10"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="input-label">Custom Image URL</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://unsplash..."
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Description</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Specifications and overview..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="chip-btn"
                  style={{ flex: 1, height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn-action-verify"
                style={{ flex: 1, height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={loadingWrite}
              >
                <span>{loadingWrite ? 'Publishing...' : editingId ? 'Save Changes' : 'Publish Product'}</span>
                {editingId ? <Check size={14} /> : <Plus size={14} />}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Right Column: Catalog Management Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Catalog Inventory</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Edit or delete catalog listing rows directly.</p>
        </div>

        <div className="table-scroll-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product Info</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={editingId === p.id ? 'bg-editing' : ''}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-primary)' }}>{p.name}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }} className="font-mono">ID: {p.id}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontFamily: 'var(--font-mono)', 
                      padding: '2px 8px', 
                      borderRadius: '9999px', 
                      border: '1px solid rgba(245, 158, 11, 0.15)', 
                      backgroundColor: 'rgba(245, 158, 11, 0.06)', 
                      color: 'var(--accent-amber)',
                      textTransform: 'uppercase'
                    }}>
                      {p.category}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{formatPrice(p.price)}</td>
                  <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                    <span style={{ 
                      color: p.stock === 0 ? 'var(--accent-rose)' : p.stock <= 5 ? 'var(--accent-amber)' : 'var(--text-secondary)', 
                      fontWeight: p.stock <= 5 ? 600 : 400 
                    }}>
                      {p.stock} units
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEditClick(p)}
                        className="btn-action-edit"
                        title="Edit Row"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="btn-action-delete"
                        title="Delete Product"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: 'auto' }}>
          <ShieldAlert size={14} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
          <span>Note: Changes apply instantly. Offline mode supports writing updates to local cache.</span>
        </div>

      </div>

    </div>
  );
}
