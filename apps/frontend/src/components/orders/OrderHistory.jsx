import React, { useState } from 'react';
import { RefreshCw, Receipt, Clock, CheckCircle2, ChevronRight, AlertCircle, Cpu, Network } from 'lucide-react';
import { formatDate, formatPrice } from '../../utils/format';

export default function OrderHistory({ 
  orders, 
  loading, 
  onRefresh, 
  onViewInvoice 
}) {
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const getStatusBadgeColor = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'success') {
      return { bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.15)', text: 'var(--accent-emerald)' };
    }
    if (s === 'pending' || s === 'processing') {
      return { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)', text: 'var(--accent-amber)' };
    }
    return { bg: 'rgba(244, 63, 94, 0.06)', border: 'rgba(244, 63, 94, 0.15)', text: 'var(--accent-rose)' };
  };

  // Pipeline stages mockup for visual execution chain
  const pipelineStages = [
    { name: 'ALB HTTP POST', label: 'API request validated', devText: 'Fargate Container routing' },
    { name: 'SNS Event Published', label: 'Order topic notification dispatched', devText: 'hybrid-order-events' },
    { name: 'SQS Buffer Queue', label: 'Message consumed from queue', devText: 'hybrid-invoice-queue' },
    { name: 'Lambda Processor', label: 'PDF template compiled', devText: 'GenerateInvoicePDF' },
    { name: 'S3 Archival', label: 'Receipt PDF committed to bucket', devText: 'hybrid-invoice-bucket' },
    { name: 'SES Sandbox Dispatch', label: 'Notification mail sent to customer', devText: 'verified-ses-email' }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>My Orders</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Real-time status updates and AWS serverless pipeline monitoring</p>
        </div>
        <button 
          onClick={onRefresh}
          className="chip-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px' }}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync Log</span>
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div className="animate-spin" style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
          <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Syncing event pipelines...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
          <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>No order events logged</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Complete a checkout flow to see how backend containers and SAM lambdas interact.</p>
        </div>
      ) : (
        <div className="admin-console-grid">
          
          {/* Left Panel: Orders List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map((order) => {
              const totalItems = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
              const isSelected = selectedOrderDetails?.id === order.id;
              const badgeColors = getStatusBadgeColor(order.status);

              return (
                <div 
                  key={order.id} 
                  className="glass-card"
                  style={{ 
                    padding: '16px', 
                    cursor: 'pointer', 
                    borderLeft: isSelected ? '3px solid var(--primary)' : '1px solid var(--border-color)', 
                    background: isSelected ? 'rgba(129, 140, 248, 0.03)' : 'var(--bg-secondary)',
                    transition: 'all var(--transition-fast)'
                  }}
                  onClick={() => setSelectedOrderDetails(order)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }} className="font-mono">{order.id}</span>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{formatDate(order.createdAt)}</p>
                    </div>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontFamily: 'var(--font-mono)', 
                      padding: '2px 8px', 
                      borderRadius: '9999px', 
                      border: '1px solid', 
                      backgroundColor: badgeColors.bg, 
                      borderColor: badgeColors.border, 
                      color: badgeColors.text,
                      textTransform: 'uppercase'
                    }}>
                      {order.status || 'Processing'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.02)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalItems}</span> {totalItems === 1 ? 'item' : 'items'} • <span className="font-mono">{order.customerEmail || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">{formatPrice(order.total || 0)}</span>
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Panel: Detailed Visual DevOps Pipeline */}
          <div>
            {selectedOrderDetails ? (
              <div className="bezel-shell">
                <div className="bezel-core" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Detailed Meta */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Order Processing Pipeline</h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>ID: {selectedOrderDetails.id}</p>
                    </div>
                    
                    {/* View Invoice trigger */}
                    <button 
                      onClick={() => onViewInvoice(selectedOrderDetails)}
                      className="chip-btn"
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', height: '28px' }}
                    >
                      <Receipt size={12} />
                      <span>View Invoice</span>
                    </button>
                  </div>

                  {/* Visual Timeline Pipeline */}
                  <div className="pipeline-flow-container">
                    {pipelineStages.map((stage, idx) => {
                      return (
                        <div key={idx} className="pipeline-step-item">
                          <div className="pipeline-circle-index" style={{ 
                            backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                            border: '1px solid rgba(16, 185, 129, 0.2)', 
                            color: 'var(--accent-emerald)'
                          }}>
                            ✓
                          </div>
                          <div>
                            <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">{stage.name}</h5>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{stage.label}</p>
                            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', opacity: 0.8 }} className="font-mono">{stage.devText}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Shipping Summary */}
                  {selectedOrderDetails.shipping && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                      <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Summary</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <p>Recipient: {selectedOrderDetails.shipping.fullName}</p>
                        <p>Address: {selectedOrderDetails.shipping.address}, {selectedOrderDetails.shipping.city}</p>
                        {selectedOrderDetails.shipping.notes && (
                          <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '4px' }}>Notes: "{selectedOrderDetails.shipping.notes}"</p>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', textAlign: 'center', padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <Network size={36} style={{ color: 'var(--primary)', opacity: 0.4, marginBottom: '12px' }} className="animate-pulse" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Select an order log entry</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px' }}>Click on any order on the left to monitor its live event-driven AWS serverless routing details.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
