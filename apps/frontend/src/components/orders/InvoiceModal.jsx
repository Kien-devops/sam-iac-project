import React from 'react';
import { X, FileText, Download, CheckCircle2 } from 'lucide-react';
import { formatDate, formatPrice } from '../../utils/format';

export default function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  const handleDownload = () => {
    // Simulated PDF S3 dispatch
    const content = `INVOICE ${order.id}\nCustomer: ${order.customerEmail}\nTotal: $${order.total}\nDate: ${order.createdAt}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const subtotal = order.total || 0;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="modal-center-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', gap: '20px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Invoice Preview</span>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Invoice Body Document Sheet */}
        <div className="invoice-overlay" style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>HYBRID CLOUD</h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>E-Commerce Event Serverless Platform</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>Receipt Invoice</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>Ref: {order.id}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Date: {formatDate(order.createdAt)}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '16px 0', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Billed To</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }} className="font-mono">{order.customerEmail}</p>
              {order.shipping && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  <p>{order.shipping.fullName}</p>
                  <p>{order.shipping.address}, {order.shipping.city}</p>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Stored Archival</span>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }} className="font-mono">Bucket: <span style={{ color: 'var(--primary)' }}>hybrid-invoice-bucket</span></p>
              <div style={{ marginTop: '6px' }}>
                <span className="card-badge-stock" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-emerald)', padding: '1px 6px', fontSize: '0.6rem' }}>COMMITTED</span>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <th style={{ textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-muted)', paddingBottom: '8px', textTransform: 'uppercase' }}>Item Description</th>
                <th style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', paddingBottom: '8px', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)', paddingBottom: '8px', textTransform: 'uppercase' }}>Price</th>
                <th style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)', paddingBottom: '8px', textTransform: 'uppercase' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index} style={{ borderBottom: index < (order.items?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none' }}>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-primary)', padding: '10px 0' }}>{item.name}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '10px 0' }} className="font-mono">{item.quantity}</td>
                  <td style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '10px 0' }} className="font-mono">{formatPrice(item.price)}</td>
                  <td style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-primary)', padding: '10px 0' }} className="font-mono">{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Invoice Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px' }}>
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal:</span>
                <span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Estimated Tax (8%):</span>
                <span className="font-mono">{formatPrice(tax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Shipping:</span>
                <span className="font-mono">FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '4px' }}>
                <span>Total Billing:</span>
                <span className="font-mono">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px', marginTop: '24px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Thank you for buying from Hybrid Cloud. This receipt was generated by an AWS Lambda execution.
          </div>

        </div>

        {/* Modal Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <button onClick={onClose} className="chip-btn" style={{ padding: '6px 16px' }}>Close</button>
          
          <button 
            onClick={handleDownload} 
            className="btn-action-verify"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px' }}
          >
            <Download size={12} />
            <span>Download Receipt</span>
          </button>
        </div>

      </div>
    </div>
  );
}
