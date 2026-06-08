import { useState, useEffect } from 'react';

/**
 * Custom React hook for managing the shopping cart.
 */
export function useCart() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('hybrid-cloud-cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('hybrid-cloud-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, notify) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (notify) notify('success', `Incremented quantity of ${product.name} in cart.`);
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (notify) notify('success', `Added ${product.name} to cart.`);
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        category: product.category,
        imageUrl: product.imageUrl,
        quantity: 1 
      }];
    });
  };

  const removeFromCart = (productId, notify) => {
    setCart(prev => {
      const item = prev.find(i => i.id === productId);
      if (item && notify) notify('warning', `Removed ${item.name} from cart.`);
      return prev.filter(i => i.id !== productId);
    });
  };

  const updateQuantity = (productId, quantity, notify) => {
    if (quantity <= 0) {
      removeFromCart(productId, notify);
      return;
    }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTax = () => {
    // 8% simulated tax
    return getSubtotal() * 0.08;
  };

  const getShipping = () => {
    const sub = getSubtotal();
    if (sub === 0) return 0;
    // Free shipping for orders over $500
    return sub > 500 ? 0 : 15;
  };

  const getTotal = () => {
    return getSubtotal() + getTax() + getShipping();
  };

  return {
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
  };
}
