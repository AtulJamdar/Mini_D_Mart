import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SavedListContext = createContext(null);

export const SavedListProvider = ({ children }) => {
  const { user } = useAuth();
  const storageKey = user ? `saved_list_${user._id}` : 'saved_list_guest';

  const [savedItems, setSavedItems] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Re-sync when user changes (e.g. login/logout)
  useEffect(() => {
    try {
      const key = user ? `saved_list_${user._id}` : 'saved_list_guest';
      const stored = localStorage.getItem(key);
      setSavedItems(stored ? JSON.parse(stored) : []);
    } catch {
      setSavedItems([]);
    }
  }, [user]);

  // Persist to localStorage whenever savedItems changes
  useEffect(() => {
    try {
      const key = user ? `saved_list_${user._id}` : 'saved_list_guest';
      localStorage.setItem(key, JSON.stringify(savedItems));
    } catch (err) {
      console.warn('Failed to save list to localStorage:', err);
    }
  }, [savedItems, user]);

  const isSaved = useCallback(
    (productId) => {
      if (!productId) return false;
      const targetId = typeof productId === 'object' ? productId._id : productId;
      return savedItems.some((item) => (item._id || item) === targetId);
    },
    [savedItems]
  );

  const toggleSave = useCallback(
    (product) => {
      if (!product || !product._id) return false;

      setSavedItems((prev) => {
        const exists = prev.some((item) => item._id === product._id);
        if (exists) {
          return prev.filter((item) => item._id !== product._id);
        } else {
          return [...prev, product];
        }
      });

      return !isSaved(product._id);
    },
    [isSaved]
  );

  const removeSavedItem = useCallback((productId) => {
    setSavedItems((prev) => prev.filter((item) => item._id !== productId));
  }, []);

  const clearSavedList = useCallback(() => {
    setSavedItems([]);
  }, []);

  const value = {
    savedItems,
    savedCount: savedItems.length,
    isSaved,
    toggleSave,
    removeSavedItem,
    clearSavedList,
  };

  return <SavedListContext.Provider value={value}>{children}</SavedListContext.Provider>;
};

export const useSavedList = () => {
  const context = useContext(SavedListContext);
  if (!context) {
    throw new Error('useSavedList must be used within a SavedListProvider');
  }
  return context;
};

export default SavedListContext;
