import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addingId, setAddingId] = useState(null);
  const [feedback, setFeedback] = useState({ id: null, msg: '', isError: false });

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadProducts = async () => {
    setLoading(true);
    try {
      let res = await api.get('/products');
      if (res.data.success && res.data.data?.length === 0) {
        // Auto-seed sample catalog if store is fresh
        await api.post('/products/seed');
        res = await api.get('/products');
      }
      if (res.data.success) {
        setProducts(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAddingId(product._id);
    setFeedback({ id: null, msg: '', isError: false });

    const result = await addToCart(product._id, 1);
    setAddingId(null);

    if (result.success) {
      setFeedback({ id: product._id, msg: 'Added to cart!', isError: false });
    } else {
      setFeedback({ id: product._id, msg: result.error, isError: true });
    }

    setTimeout(() => {
      setFeedback({ id: null, msg: '', isError: false });
    }, 2500);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Daily Grocery & Essentials</h1>
          <p className="text-sm text-gray-500">Pick fresh essentials at everyday low Mini D-Mart prices.</p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search items, milk, rice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-primary shadow-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-border">
          <p className="text-gray-500 text-sm">No matching items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const isAdding = addingId === product._id;
            const hasFeedback = feedback.id === product._id;

            return (
              <div
                key={product._id}
                className="bg-white rounded-2xl border border-border p-4 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-colors"
              >
                <div>
                  {/* Image Container */}
                  <div className="h-44 bg-bg rounded-xl mb-3 overflow-hidden border border-border/40 relative">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                    )}

                    {/* Stock badge */}
                    <div className="absolute top-2 right-2">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full bg-error/90 text-white text-[10px] font-bold">
                          Out of Stock
                        </span>
                      ) : product.stock <= 5 ? (
                        <span className="px-2 py-0.5 rounded-full bg-accent/90 text-white text-[10px] font-bold">
                          {product.stock} left
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-primary/90 text-white text-[10px] font-semibold">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-text text-sm line-clamp-2 leading-snug">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>{product.unit}</span>
                    <span>{product.categoryId?.name}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-primary">₹{product.price.toFixed(2)}</span>
                  </div>

                  {hasFeedback && (
                    <div
                      className={`text-[11px] mb-2 p-1.5 rounded-lg text-center font-medium ${
                        feedback.isError
                          ? 'bg-error/10 text-error'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {feedback.msg}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isOutOfStock || isAdding}
                    onClick={() => handleAddToCart(product)}
                    className="w-full py-2 px-3 bg-primary text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    {isAdding ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : isOutOfStock ? (
                      'Unavailable'
                    ) : (
                      'Add to Cart'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
