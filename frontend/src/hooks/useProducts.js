import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useProducts({ category, search, storeId } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (category) params.category = category;
      if (search) params.search = search;
      if (storeId) params.storeId = storeId;

      let res = await api.get('/products', { params });
      if (res.data.success && res.data.data?.length === 0 && !search && !category) {
        // Auto-seed catalog if brand new DB
        try {
          await api.post('/products/seed');
          res = await api.get('/products', { params });
        } catch (seedErr) {
          console.warn('Seed error:', seedErr.message);
        }
      }

      if (res.data.success) {
        setProducts(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err.message);
      setError(err.response?.data?.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, [category, search, storeId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}

export default useProducts;
