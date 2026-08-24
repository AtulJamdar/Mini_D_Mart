import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const GUEST_CART_KEY = 'guest_cart_dmart';

// Calculate totals helper
const calculateCartTotals = (items = []) => {
  const itemCount = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
    0
  );
  const tax = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return {
    items,
    itemCount,
    subtotal: Number(subtotal.toFixed(2)),
    tax,
    total,
  };
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        const parsedItems = JSON.parse(stored);
        return calculateCartTotals(parsedItems);
      }
    } catch {
      // fallback
    }
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync authenticated cart from backend, or re-fetch current product details for guest items
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      try {
        const stored = localStorage.getItem(GUEST_CART_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Re-fetch current price and stock from backend so guest cart is not stale
            const productIds = parsed
              .map((item) => item.productId?._id || item.productId || item._id)
              .filter(Boolean);

            if (productIds.length > 0) {
              try {
                const res = await api.get(`/products?ids=${productIds.join(',')}`);
                if (res.data.success && Array.isArray(res.data.data)) {
                  const productMap = new Map(res.data.data.map((p) => [p._id.toString(), p]));
                  const updatedItems = parsed
                    .map((item) => {
                      const pId = (item.productId?._id || item.productId || item._id)?.toString();
                      const liveProduct = productMap.get(pId);
                      if (!liveProduct) return null; // removed from store
                      return {
                        ...item,
                        name: liveProduct.name,
                        price: liveProduct.price,
                        unit: liveProduct.unit,
                        images: liveProduct.images || [],
                        stock: liveProduct.stock,
                        availableStock: liveProduct.stock,
                        isAvailable: liveProduct.stock >= (item.qty || 1),
                      };
                    })
                    .filter(Boolean);

                  setCart(calculateCartTotals(updatedItems));
                  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedItems));
                  return;
                }
              } catch {
                // If offline or network issue, fallback to localStorage snapshot
              }
            }

            setCart(calculateCartTotals(parsed));
          } else {
            setCart({ items: [], itemCount: 0, subtotal: 0, tax: 0, total: 0 });
          }
        } else {
          setCart({ items: [], itemCount: 0, subtotal: 0, tax: 0, total: 0 });
        }
      } catch {
        setCart({ items: [], itemCount: 0, subtotal: 0, tax: 0, total: 0 });
      }
      return;
    }

    setLoading(true);
    try {
      // If there are guest cart items, sync them to backend first
      const guestStored = localStorage.getItem(GUEST_CART_KEY);
      if (guestStored) {
        const guestItems = JSON.parse(guestStored);
        if (Array.isArray(guestItems) && guestItems.length > 0) {
          for (const item of guestItems) {
            const pId = item.productId?._id || item.productId || item._id;
            if (pId) {
              await api.post('/cart/items', { productId: pId, qty: item.qty || 1 }).catch(() => {});
            }
          }
          localStorage.removeItem(GUEST_CART_KEY);
        }
      }

      const response = await api.get('/cart');
      if (response.data.success && response.data.data) {
        setCart(response.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch cart:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Persist guest cart changes to localStorage when not authenticated
  const saveGuestCart = (items) => {
    const updated = calculateCartTotals(items);
    setCart(updated);
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist guest cart:', e);
    }
    return { success: true, data: updated };
  };

  const addToCart = async (productOrId, qty = 1) => {
    setError(null);
    setActionLoading(true);

    const isObj = typeof productOrId === 'object' && productOrId !== null;
    const productId = isObj ? productOrId._id : productOrId;

    if (!productId) {
      setActionLoading(false);
      return { success: false, error: 'Invalid product' };
    }

    // 1. Authenticated User Flow
    if (isAuthenticated) {
      try {
        const response = await api.post('/cart/items', { productId, qty });
        if (response.data.success) {
          setCart(response.data.data);
          return { success: true, data: response.data.data };
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to add item to cart';
        setError(errMsg);
        return { success: false, error: errMsg };
      } finally {
        setActionLoading(false);
      }
    }

    // 2. Guest User Flow (Local Storage Cart)
    try {
      const currentItems = [...(cart.items || [])];
      const existingIdx = currentItems.findIndex(
        (item) => (item.productId?._id || item.productId || item._id) === productId
      );

      if (existingIdx > -1) {
        const existing = currentItems[existingIdx];
        const newQty = (existing.qty || 1) + qty;
        currentItems[existingIdx] = {
          ...existing,
          qty: newQty,
        };
      } else {
        const newItem = {
          _id: productId,
          productId: isObj ? productOrId : productId,
          name: isObj ? productOrId.name : 'Product',
          price: isObj ? Number(productOrId.price) : 0,
          unit: isObj ? productOrId.unit : '1 pc',
          images: isObj ? productOrId.images || [] : [],
          qty: Number(qty) || 1,
          stock: isObj ? productOrId.stock : 99,
          availableStock: isObj ? productOrId.stock : 99,
        };
        currentItems.push(newItem);
      }

      const res = saveGuestCart(currentItems);
      return res;
    } catch (err) {
      setError('Failed to add item to local cart');
      return { success: false, error: 'Failed to add item' };
    } finally {
      setActionLoading(false);
    }
  };

  const updateQty = async (productId, qty) => {
    setError(null);
    setActionLoading(true);

    if (isAuthenticated) {
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
    }

    // Guest update
    try {
      let currentItems = [...(cart.items || [])];
      if (qty <= 0) {
        currentItems = currentItems.filter(
          (item) => (item.productId?._id || item.productId || item._id) !== productId
        );
      } else {
        currentItems = currentItems.map((item) => {
          if ((item.productId?._id || item.productId || item._id) === productId) {
            return { ...item, qty: Number(qty) };
          }
          return item;
        });
      }
      saveGuestCart(currentItems);
      return { success: true };
    } finally {
      setActionLoading(false);
    }
  };

  const removeItem = async (productId) => {
    setError(null);
    setActionLoading(true);

    if (isAuthenticated) {
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
    }

    // Guest remove
    try {
      const currentItems = (cart.items || []).filter(
        (item) => (item.productId?._id || item.productId || item._id) !== productId
      );
      saveGuestCart(currentItems);
      return { success: true };
    } finally {
      setActionLoading(false);
    }
  };

  const clearCart = async () => {
    setError(null);
    setActionLoading(true);

    if (isAuthenticated) {
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
    }

    // Guest clear
    try {
      localStorage.removeItem(GUEST_CART_KEY);
      setCart({ items: [], itemCount: 0, subtotal: 0, tax: 0, total: 0 });
      return { success: true };
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
