import React, { useState } from 'react';
import { Truck, CreditCard, ShieldCheck, ShoppingCart, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export default function CheckoutWizard({
  cart,
  total,
  customerEmail,
  onClose,
  onSubmitOrder,
  loadingOrder
}) {
  const [step, setStep] = useState('shipping'); // 'shipping', 'payment', 'review', 'success'
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod', 'card'
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: ''
  });
  const [placedOrder, setPlacedOrder] = useState(null);

  // Validations
  const validateShipping = () => {
    const { fullName, address, city, zipCode, phone } = shippingInfo;
    if (!fullName.trim() || !address.trim() || !city.trim() || !zipCode.trim() || !phone.trim()) {
      return false;
    }
    return true;
  };

  const validateCard = () => {
    if (paymentMethod === 'cod') return true;
    const { cardNumber, cardExpiry, cardCvv } = cardInfo;
    return cardNumber.replace(/\s/g, '').length >= 15 && cardExpiry.includes('/') && cardCvv.length >= 3;
  };

  const handleNextStep = () => {
    if (step === 'shipping') {
      if (!validateShipping()) return;
      setStep('payment');
    } else if (step === 'payment') {
      if (!validateCard()) return;
      setStep('review');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const billingInfo = {
      ...shippingInfo,
      paymentMethod,
      ...(paymentMethod === 'card' ? cardInfo : {})
    };
    
    const order = await onSubmitOrder(billingInfo);
    if (order) {
      setPlacedOrder(order);
      setStep('success');
    }
  };

  return (
    <div className="overlay-backdrop">
      <div className="modal-center-panel" onClick={(e) => e.stopPropagation()} style={{ gap: '24px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Checkout Wizard</h2>
          {step !== 'success' && (
            <button 
              onClick={onClose} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Step Indicator Progress Bar */}
        {step !== 'success' && (
          <div className="stepper-flow" style={{ paddingBottom: '20px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step === 'shipping' ? 'var(--primary)' : (step === 'payment' || step === 'review') ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 'shipping' ? 'rgba(129,140,248,0.1)' : (step === 'payment' || step === 'review') ? 'rgba(16,185,129,0.1)' : 'transparent', border: '1px solid currentColor', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Truck size={12} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Shipping</span>
            </div>
            
            <div style={{ flexGrow: 1, borderBottom: '1px dashed var(--border-color)', margin: '0 12px', alignSelf: 'center' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step === 'payment' ? 'var(--primary)' : step === 'review' ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 'payment' ? 'rgba(129,140,248,0.1)' : step === 'review' ? 'rgba(16,185,129,0.1)' : 'transparent', border: '1px solid currentColor', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CreditCard size={12} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Payment</span>
            </div>
            
            <div style={{ flexGrow: 1, borderBottom: '1px dashed var(--border-color)', margin: '0 12px', alignSelf: 'center' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step === 'review' ? 'var(--primary)' : 'var(--text-muted)' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 'review' ? 'rgba(129,140,248,0.1)' : 'transparent', border: '1px solid currentColor', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ShieldCheck size={12} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Review</span>
            </div>
          </div>
        )}

        {/* Main Step Content */}
        <div>
          
          {step === 'shipping' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Shipping Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Jane Doe"
                    value={shippingInfo.fullName}
                    onChange={e => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                    required
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Address</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="123 ECS Blvd, Apt 4B"
                    value={shippingInfo.address}
                    onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">City</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Seattle"
                    value={shippingInfo.city}
                    onChange={e => setShippingInfo({...shippingInfo, city: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Zip Code</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="98101"
                    value={shippingInfo.zipCode}
                    onChange={e => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                    required
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Phone Number</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="206-555-0100"
                    value={shippingInfo.phone}
                    onChange={e => setShippingInfo({...shippingInfo, phone: e.target.value})}
                    required
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Order Notes (Optional)</label>
                  <textarea
                    className="input-field"
                    placeholder="Gate code, delivery instructions..."
                    rows={2}
                    value={shippingInfo.notes}
                    onChange={e => setShippingInfo({...shippingInfo, notes: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button onClick={onClose} className="chip-btn" style={{ padding: '8px 16px' }}>Cancel</button>
                <button 
                  onClick={handleNextStep} 
                  className="btn-action-verify"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={!validateShipping()}
                >
                  <span>Continue to Payment</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Payment Method</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div 
                  className="bezel-shell" 
                  style={{ cursor: 'pointer', borderColor: paymentMethod === 'cod' ? 'var(--primary)' : 'rgba(255,255,255,0.03)' }}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <div className="bezel-core" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--border-color)', backgroundColor: paymentMethod === 'cod' ? 'var(--primary)' : 'transparent', marginTop: '2px', flexShrink: 0 }}></div>
                    <div>
                      <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cash on Delivery (COD)</h5>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Pay with cash upon package receipt.</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="bezel-shell" 
                  style={{ cursor: 'pointer', borderColor: paymentMethod === 'card' ? 'var(--primary)' : 'rgba(255,255,255,0.03)' }}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="bezel-core" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--border-color)', backgroundColor: paymentMethod === 'card' ? 'var(--primary)' : 'transparent', marginTop: '2px', flexShrink: 0 }}></div>
                    <div>
                      <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Credit / Debit Card</h5>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Safe gateway simulation check.</p>
                    </div>
                  </div>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px', animation: 'fadeIn var(--transition-fast) forwards' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="input-label">Card Number</label>
                    <input
                      type="text"
                      className="input-field font-mono"
                      placeholder="4111 2222 3333 4444"
                      value={cardInfo.cardNumber}
                      onChange={e => setCardInfo({...cardInfo, cardNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Expiry Date</label>
                    <input
                      type="text"
                      className="input-field font-mono"
                      placeholder="MM/YY"
                      value={cardInfo.cardExpiry}
                      onChange={e => setCardInfo({...cardInfo, cardExpiry: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">CVV</label>
                    <input
                      type="password"
                      className="input-field font-mono"
                      placeholder="3-digit"
                      maxLength={3}
                      value={cardInfo.cardCvv}
                      onChange={e => setCardInfo({...cardInfo, cardCvv: e.target.value})}
                      required
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button onClick={() => setStep('shipping')} className="chip-btn" style={{ padding: '8px 16px' }}>Back</button>
                <button 
                  onClick={handleNextStep} 
                  className="btn-action-verify"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={!validateCard()}
                >
                  <span>Review Order</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Order Confirmation Summary</h3>
              
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--bg-tertiary)' }}>
                {/* Items list summary */}
                <div>
                  <h4 style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em' }}>Purchased Items</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {cart.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{item.name} <strong style={{ color: 'var(--primary)' }}>x{item.quantity}</strong></span>
                        <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery address & payment method */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.05em' }}>Shipping To</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{shippingInfo.fullName}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{shippingInfo.address}, {shippingInfo.city}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Phone: {shippingInfo.phone}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.05em' }}>Payment Mode</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', textTransform: 'uppercase' }} className="font-mono">{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card'}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Invoicing: {customerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Total Row */}
              <div style={{ borderTop: '1px solid var(--border-color)', pt: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Final Billing Amount:</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }} className="font-mono">{formatPrice(total)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setStep('payment')} className="chip-btn" style={{ padding: '8px 16px' }}>Back</button>
                <button 
                  onClick={handleSubmit} 
                  className="btn-action-verify" 
                  style={{ padding: '8px 24px' }}
                  disabled={loadingOrder}
                >
                  {loadingOrder ? 'Processing Event Engine...' : 'Place Secure Order'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '16px 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-emerald)', marginBottom: '8px' }}>
                <CheckCircle2 size={32} className="animate-pulse" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Order Confirmed!</h3>
              
              <div className="bezel-shell" style={{ width: '100%', maxWidth: '380px' }}>
                <div className="bezel-core" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order ID:</span>
                    <strong style={{ fontSize: '0.75rem', color: 'var(--primary)' }} className="font-mono">{placedOrder?.id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer:</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }} className="font-mono">{placedOrder?.customerEmail}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Billing total:</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }} className="font-mono">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(129,140,248,0.04)', border: '1px solid rgba(129,140,248,0.1)', borderRadius: '8px', padding: '12px', maxWidth: '440px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'left', lineHeight: '1.4' }}>
                <AlertCircle size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>System Pipeline Action:</strong> Orders are published to the <code>hybrid-order-events</code> SNS topic. SQS triggers Lambda <code>GenerateInvoicePDF</code> to compile and archive invoices to S3, with customer notices dispatched via SES sandbox.
                </span>
              </div>

              <button 
                onClick={onClose} 
                className="btn-action-verify"
                style={{ padding: '10px 32px', marginTop: '8px' }}
              >
                Return to Shop
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
