import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export function useOrders(backendStatus, notify) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  // Email verification persistence
  const [customerEmail, setCustomerEmail] = useState(() => {
    return localStorage.getItem('hybrid-customer-email') || '';
  });
  const [verificationStatus, setVerificationStatus] = useState(() => {
    return localStorage.getItem('hybrid-email-status') || 'unverified'; // 'unverified', 'pending', 'verified'
  });

  // Persist email & status
  useEffect(() => {
    localStorage.setItem('hybrid-customer-email', customerEmail);
    localStorage.setItem('hybrid-email-status', verificationStatus);
  }, [customerEmail, verificationStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await apiService.getOrders();
      setOrders(data);
    } catch (e) {
      if (notify) notify('error', 'Failed to retrieve order history logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [backendStatus]);

  const handleVerifyEmail = async (email) => {
    if (!email || !email.trim() || !email.includes('@')) {
      if (notify) notify('error', 'Please enter a valid email address.');
      return;
    }
    const cleanEmail = email.trim();
    setCustomerEmail(cleanEmail);
    setLoadingVerify(true);
    try {
      const result = await apiService.verifyEmail(cleanEmail);
      if (result.success) {
        setVerificationStatus('pending');
        if (notify) notify('success', result.message || 'Verification link sent by AWS SES.');
      } else {
        setVerificationStatus('verified'); // Fallback or mock validation
        if (notify) notify('warning', `Simulated: Verification link generated.`);
      }
    } catch (error) {
      setVerificationStatus('unverified');
      if (notify) notify('error', 'SES Sandbox connection failed.');
    } finally {
      setLoadingVerify(false);
    }
  };

  const confirmVerificationSimulated = () => {
    setVerificationStatus('verified');
    if (notify) notify('success', `Email ${customerEmail} marked as verified.`);
  };

  const handlePlaceOrder = async (cartItems, total, shippingInfo) => {
    if (cartItems.length === 0) return null;
    if (verificationStatus !== 'verified' && backendStatus === 'online') {
      if (notify) notify('error', 'Your email must be verified before checkout.');
      return null;
    }

    setLoadingOrder(true);
    try {
      const orderPayload = {
        email: customerEmail,
        items: cartItems,
        total,
        shipping: shippingInfo
      };

      const completedOrder = await apiService.createOrder(orderPayload);
      setOrders(prev => [completedOrder, ...prev]);
      if (notify) {
        if (completedOrder.simulated) {
          notify('warning', 'Simulated checkout completed locally.');
        } else {
          notify('success', 'Order created successfully! Check email for receipt.');
        }
      }
      return completedOrder;
    } catch (error) {
      if (notify) notify('error', 'Failed to submit order transaction.');
      return null;
    } finally {
      setLoadingOrder(false);
    }
  };

  return {
    orders,
    loading,
    loadingOrder,
    loadingVerify,
    customerEmail,
    setCustomerEmail,
    verificationStatus,
    setVerificationStatus,
    verifyEmail: handleVerifyEmail,
    confirmVerificationSimulated,
    placeOrder: handlePlaceOrder,
    refreshOrders: fetchOrders
  };
}
