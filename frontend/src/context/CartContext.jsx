import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], itemCount: 0, subtotal: 0, tax: 0, total: 0 });
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/cart');
      if (response.data.success && response.data.data) {
        setCart(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, qty = 1) => {
    setError(null);
    setActionLoading(true);
    try {
      const response = await api.post('/cart/items', { productId, qty });
      if (response.data.success) {
        setCart(response.data.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to add item to cart';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setActionLoading(false);
    }
  };

  const updateQty = async (productId, qty) => {
    setError(null);
    setActionLoading(true);
    try {
      const response = await api.put(`/cart/items/${productId}`, { qty });
      if (response.data.success) {
        setCart(response.data.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update quantity';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setActionLoading(false);
    }
  };

  const removeItem = async (productId) => {
    setError(null);
    setActionLoading(true);
    try {
      const response = await api.delete(`/cart/items/${productId}`);
      if (response.data.success) {
        setCart(response.data.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to remove item';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setActionLoading(false);
    }
  };

  const clearCart = async () => {
    setError(null);
    setActionLoading(true);
    try {
      const response = await api.delete('/cart');
      if (response.data.success) {
        setCart(response.data.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to clear cart';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setActionLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    actionLoading,
    error,
    clearError: () => setError(null),
    fetchCart,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
