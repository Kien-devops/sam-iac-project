import React, { useState } from 'react';
import { RefreshCw, Receipt, Clock, CheckCircle2, ChevronRight, Package, CreditCard, Download, ShieldCheck, Layers } from 'lucide-react';
import { formatDate, formatPrice } from '../../utils/format';

export default function OrderHistory({ 
  orders, 
  purchasedItems = [],
  loading, 
  loadingPurchased,
  onRefresh, 
  onViewInvoice,
  onPayOrder,
  onDownloadInvoice
}) {
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [subTab, setSubTab] = useState('purchased'); // 'purchased', 'pending', 'events'

  const getStatusBadgeColor = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'success' || s === 'paid') {
      return { bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.15)', text: 'var(--accent-emerald)' };
    }
    if (s === 'pendingpayment') {
      return { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)', text: 'var(--accent-amber)' };
    }
    return { bg: 'rgba(244, 63, 94, 0.06)', border: 'rgba(244, 63, 94, 0.15)', text: 'var(--accent-rose)' };
  };

  const handlePay = async (orderId) => {
    setPayingId(orderId);
    try {
      const updated = await onPayOrder(orderId);
      if (updated && selectedOrderDetails?.id === orderId) {
        setSelectedOrderDetails(updated);
      }
    } finally {
      setPayingId(null);
    }
  };

  // Determine stage completion status
  const getPipelineStages = (status) => {
    const isCompleted = ['completed', 'success', 'paid'].includes(String(status || '').toLowerCase());
    return [
      { name: 'ALB HTTP POST', label: 'API request validated', devText: 'Fargate Container routing', completed: true },
      { name: 'SNS Event Published', label: 'Order topic notification dispatched', devText: 'hybrid-order-events', completed: true },
      { name: 'SQS Buffer Queue', label: 'Message consumed from queue', devText: 'hybrid-invoice-queue', completed: true },
      { name: 'Payment Confirmation', label: 'Credit Card / Balance paid', devText: 'POST /api/orders/:id/pay', completed: isCompleted },
      { name: 'Lambda Processor', label: 'Invoice template compiled', devText: 'GenerateInvoicePDF', completed: isCompleted },
      { name: 'S3 Archival', label: 'Receipt invoice committed to bucket', devText: 'hybrid-invoice-bucket', completed: isCompleted }
    ];
  };

  const pendingOrders = orders.filter(o => o.status === 'PendingPayment');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Account Dashboard</h2>

        </div>
        <button 
          onClick={onRefresh}
          className="chip-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px' }}
          disabled={loading || loadingPurchased}
        >
          <RefreshCw size={14} className={(loading || loadingPurchased) ? 'animate-spin' : ''} />
          <span>Sync Hub</span>
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '16px', paddingBottom: '2px' }}>
        <button
          onClick={() => setSubTab('purchased')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: subTab === 'purchased' ? '2px solid var(--primary)' : '2px solid transparent',
            color: subTab === 'purchased' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '8px 12px',
            fontSize: '0.85rem',
            fontWeight: subTab === 'purchased' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          Purchased Storage ({purchasedItems.length})
        </button>
        <button
          onClick={() => setSubTab('pending')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: subTab === 'pending' ? '2px solid var(--primary)' : '2px solid transparent',
            color: subTab === 'pending' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '8px 12px',
            fontSize: '0.85rem',
            fontWeight: subTab === 'pending' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          Pending Payments ({pendingOrders.length})
        </button>
        <button
          onClick={() => setSubTab('events')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: subTab === 'events' ? '2px solid var(--primary)' : '2px solid transparent',
            color: subTab === 'events' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '8px 12px',
            fontSize: '0.85rem',
            fontWeight: subTab === 'events' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          Event Pipeline Log ({orders.length})
        </button>
      </div>

      {/* Content Rendering based on subTab */}
      {subTab === 'purchased' && (
        <div>
          {loadingPurchased && purchasedItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div className="animate-spin" style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
              <p style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Synchronizing S3 data files...</p>
            </div>
          ) : purchasedItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
              <Package size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>No purchased items</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Complete checkout payments to register items into S3 warehouse archives.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }} className="animate-fade-in">
              {purchasedItems.map((item, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.15)', background: 'rgba(16, 185, 129, 0.05)', padding: '2px 8px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }} className="font-mono">
                      <ShieldCheck size={10} /> Sync S3
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Qty: {item.quantity}</span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }} className="font-mono">{formatPrice(item.price)}</p>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Order: <strong className="font-mono">{item.orderId}</strong></span>
                    <span>Paid: {formatDate(item.purchaseDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
              <Clock size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>All transactions cleared</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No orders are currently waiting for payment settlement.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }} className="animate-fade-in">
              {pendingOrders.map((order) => (
                <div key={order.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }} className="font-mono">{order.id}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.15)', background: 'rgba(245, 158, 11, 0.05)', padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase' }} className="font-mono">
                      Awaiting Payment
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Date Placed:</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Items count:</span>
                      <span>{order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0} items</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <span>Due Amount:</span>
                      <span className="font-mono" style={{ color: 'var(--accent-amber)' }}>{formatPrice(order.total || 0)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePay(order.id)}
                    disabled={payingId !== null}
                    className="btn-action-verify"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', height: '36px', backgroundColor: 'var(--accent-amber)', color: '#000', fontWeight: 700, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <CreditCard size={12} />
                    <span>{payingId === order.id ? 'Processing Payment...' : 'Settle Invoice Due'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'events' && (
        <div>
          {loading && orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <div className="animate-spin" style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
              <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Syncing event pipelines...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
              <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
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
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {['paid', 'completed'].includes(String(selectedOrderDetails.status || '').toLowerCase()) && (
                            <>
                              <button 
                                onClick={() => onViewInvoice(selectedOrderDetails)}
                                className="chip-btn"
                                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', height: '28px' }}
                              >
                                <Receipt size={12} />
                                <span>View</span>
                              </button>
                              <button 
                                onClick={() => onDownloadInvoice(selectedOrderDetails.id)}
                                className="chip-btn"
                                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', height: '28px', color: 'var(--accent-emerald)' }}
                              >
                                <Download size={12} />
                                <span>Download (S3)</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Payment Button if PendingPayment */}
                      {selectedOrderDetails.status === 'PendingPayment' && (
                        <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.12)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            This order is waiting for payment confirmation. Click pay to complete the transaction and generate S3 tax invoices.
                          </div>
                          <button
                            onClick={() => handlePay(selectedOrderDetails.id)}
                            disabled={payingId !== null}
                            className="btn-action-verify"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', height: '38px', backgroundColor: 'var(--accent-amber)', color: '#000', fontWeight: 700, border: 'none' }}
                          >
                            <CreditCard size={14} />
                            <span>{payingId === selectedOrderDetails.id ? 'Processing Payment...' : 'Pay Amount Due'}</span>
                          </button>
                        </div>
                      )}

                      {/* Visual Timeline Pipeline */}
                      <div className="pipeline-flow-container">
                        {getPipelineStages(selectedOrderDetails.status).map((stage, idx) => {
                          return (
                            <div key={idx} className="pipeline-step-item" style={{ opacity: stage.completed ? 1 : 0.4 }}>
                              <div className="pipeline-circle-index" style={{ 
                                backgroundColor: stage.completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)', 
                                border: stage.completed ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)', 
                                color: stage.completed ? 'var(--accent-emerald)' : 'var(--text-muted)'
                              }}>
                                {stage.completed ? '✓' : idx + 1}
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
                    <Layers size={36} style={{ color: 'var(--primary)', opacity: 0.4, marginBottom: '12px' }} className="animate-pulse" />
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Select an order log entry</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px' }}>Click on any order on the left to monitor its live event-driven AWS serverless routing details.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
