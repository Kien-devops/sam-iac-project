import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProductList from './components/products/ProductList';
import ProductDetailModal from './components/products/ProductDetailModal';
import CartDrawer from './components/cart/CartDrawer';
import CheckoutWizard from './components/checkout/CheckoutWizard';
import OrderHistory from './components/orders/OrderHistory';
import InvoiceModal from './components/orders/InvoiceModal';
import ProductForm from './components/admin/ProductForm';
import ArchDevOps from './components/devops/ArchDevOps';

import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import { useOrders } from './hooks/useOrders';
import { apiService } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('products');
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Notifications State
  const [notification, setNotification] = useState(null);
  const addNotification = (type, message) => {
    setNotification({ type, message });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [notification]);

  // Backend Status State
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'

  const checkBackendStatus = async () => {
    setBackendStatus('checking');
    try {
      const isOnline = await apiService.checkHealth();
      setBackendStatus(isOnline ? 'online' : 'offline');
      if (isOnline) {
        addNotification('success', 'Connected to AWS Event API backend.');
      } else {
        addNotification('warning', 'Backend is offline. Running with offline simulation database.');
      }
    } catch (e) {
      setBackendStatus('offline');
      addNotification('warning', 'Backend is offline. Running with offline simulation database.');
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  // Custom Hooks Hooks
  const {
    products,
    loading: loadingProducts,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    loadingWrite,
    createProduct,
    updateProduct,
    deleteProduct,
    refreshProducts
  } = useProducts(backendStatus, addNotification);

  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getCount,
    getTax,
    getShipping,
    getTotal
  } = useCart();

  const {
    orders,
    loading: loadingOrders,
    loadingOrder,
    loadingVerify,
    customerEmail,
    setCustomerEmail,
    verificationStatus,
    verifyEmail,
    confirmVerificationSimulated,
    placeOrder,
    refreshOrders
  } = useOrders(backendStatus, addNotification);

  return (
    <div className="platform-container">
      
      {/* Floating Notifications Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type} animate-slide-in`}>
          <div className="toast-content">
            <span className="toast-dot"></span>
            <span className="toast-message">{notification.message}</span>
          </div>
          <button className="toast-close" onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      {/* Platform Header */}
      <Header
        backendStatus={backendStatus}
        onRetryHealth={checkBackendStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={getCount()}
        cartSubtotal={getSubtotal()}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Sections */}
      <main className="main-viewport max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        
        {/* Tab 1: Catalog */}
        {activeTab === 'products' && (
          <ProductList
            products={products}
            loading={loadingProducts}
            categories={categories}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onAddToCart={(p) => addToCart(p, addNotification)}
            onViewDetails={setSelectedProductDetail}
          />
        )}

        {/* Tab 2: Logs & History */}
        {activeTab === 'orders' && (
          <OrderHistory
            orders={orders}
            loading={loadingOrders}
            onRefresh={refreshOrders}
            onViewInvoice={setViewingInvoice}
          />
        )}

        {/* Tab 3: Admin Console */}
        {activeTab === 'admin' && (
          <ProductForm
            products={products}
            onCreateProduct={createProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
            loadingWrite={loadingWrite}
          />
        )}

        {/* Tab 4: Architecture */}
        {activeTab === 'system' && (
          <ArchDevOps />
        )}

      </main>

      {/* Sidebar Drawers & Modal Dialogs */}
      
      {/* Detail Specifications Slide-over */}
      {selectedProductDetail && (
        <ProductDetailModal
          product={selectedProductDetail}
          onClose={() => setSelectedProductDetail(null)}
          onAddToCart={(p) => {
            addToCart(p, addNotification);
            setSelectedProductDetail(null);
          }}
        />
      )}

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          updateQuantity={(id, qty) => updateQuantity(id, qty, addNotification)}
          removeFromCart={(id) => removeFromCart(id, addNotification)}
          getSubtotal={getSubtotal}
          getTax={getTax}
          getShipping={getShipping}
          getTotal={getTotal}
          customerEmail={customerEmail}
          setCustomerEmail={setCustomerEmail}
          verificationStatus={verificationStatus}
          onVerifyEmail={verifyEmail}
          onConfirmVerificationSimulated={confirmVerificationSimulated}
          onProceedToCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
          backendStatus={backendStatus}
        />
      )}

      {/* Checkout Wizard Overlay */}
      {isCheckoutOpen && (
        <CheckoutWizard
          cart={cart}
          total={getTotal()}
          customerEmail={customerEmail}
          onClose={() => setIsCheckoutOpen(false)}
          onSubmitOrder={async (shippingInfo) => {
            const completedOrder = await placeOrder(cart, getTotal(), shippingInfo);
            if (completedOrder) {
              clearCart();
              refreshProducts(); // refresh stock counts
              refreshOrders(); // refresh order logs list
              return completedOrder;
            }
            return null;
          }}
          loadingOrder={loadingOrder}
        />
      )}

      {/* PDF Receipt Invoice Viewer */}
      {viewingInvoice && (
        <InvoiceModal
          order={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      {/* Platform Footer */}
      <Footer />

    </div>
  );
}

export default App;
