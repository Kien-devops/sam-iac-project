import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export function useOrders(backendStatus, notify, currentUser) {
  const [orders, setOrders] = useState([]);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPurchased, setLoadingPurchased] = useState(false);
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

  // Real-time WebSocket connection to receive live order updates
  useEffect(() => {
    if (!currentUser || !currentUser.token) {
      return;
    }

    const wsUrlEnv = import.meta.env.VITE_WEBSOCKET_URL;
    let wsUrl = '';
    if (wsUrlEnv) {
      wsUrl = wsUrlEnv;
    } else {
      const base = import.meta.env.VITE_API_URL || '';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      if (base.startsWith('http')) {
        wsUrl = base.replace(/^http/, 'ws');
      } else {
        wsUrl = `${protocol}//${window.location.host}`;
      }
    }

    const fullWsUrl = `${wsUrl}?token=${currentUser.token}`;
    console.log(`[WebSocket] Connecting to: ${fullWsUrl}`);
    
    let socket;
    try {
      socket = new WebSocket(fullWsUrl);
    } catch (e) {
      console.error('[WebSocket] Connection attempt failed:', e);
      return;
    }

    socket.onopen = () => {
      console.log('[WebSocket] Connection established successfully.');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[WebSocket] Received update:', message);

        if (message.type === 'ORDER_UPDATE') {
          const { orderId, status } = message;
          if (notify) {
            notify('success', `Pipeline Update: Order ${orderId} status changed to ${status}!`);
          }

          // Force local update in state
          setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
              return { ...o, status };
            }
            return o;
          }));

          // Refresh purchased list if order is completed
          if (status === 'Completed') {
            fetchPurchasedItems();
          }
        }
      } catch (err) {
        console.error('[WebSocket] Error processing socket message:', err);
      }
    };

    socket.onclose = (e) => {
      console.log('[WebSocket] Connection closed:', e.reason);
    };

    socket.onerror = (err) => {
      console.error('[WebSocket] Error occurred on connection:', err);
    };

    return () => {
      console.log('[WebSocket] Cleaning up connection');
      socket.close();
    };
  }, [currentUser]);

  const fetchPurchasedItems = async () => {
    setLoadingPurchased(true);
    try {
      const data = await apiService.getUserPurchasedItems();
      setPurchasedItems(data);
    } catch (e) {
      console.warn("Failed to retrieve purchased items:", e);
    } finally {
      setLoadingPurchased(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await apiService.getOrders();
      setOrders(data);
      await fetchPurchasedItems();
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
          notify('warning', 'Order placed! Proceed to pay to generate invoice.');
        } else {
          notify('success', 'Order placed successfully! Proceed to pay to generate invoice.');
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

  const handlePayOrder = async (orderId) => {
    setLoadingOrder(true);
    try {
      const updatedOrder = await apiService.payOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      if (notify) notify('success', 'Payment processed successfully! S3 Tax Invoice generated.');
      return updatedOrder;
    } catch (error) {
      if (notify) notify('error', error.message || 'Payment simulation failed.');
      return null;
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const content = await apiService.downloadInvoice(orderId);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (notify) notify('success', 'Tax Invoice file downloaded.');
    } catch (error) {
      if (notify) notify('error', 'Failed to download invoice file.');
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
    payOrder: handlePayOrder,
    downloadInvoice: handleDownloadInvoice,
    refreshOrders: fetchOrders,
    purchasedItems,
    loadingPurchased,
    refreshPurchasedItems: fetchPurchasedItems
  };
}
