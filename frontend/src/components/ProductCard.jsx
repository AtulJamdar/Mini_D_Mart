import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Bookmark, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSavedList } from '../context/SavedListContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAuthenticated, setUser } = useAuth();
  const { isSaved, toggleSave } = useSavedList();
  const navigate = useNavigate();

  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState({ msg: '', isError: false });

  const isOutOfStock = product.stock <= 0;
  const saved = isSaved(product._id);

  const handleToggleSave = (e) => {
    e.stopPropagation();
    const willBeSaved = !saved;
    toggleSave(product);
    setFeedback({
      msg: willBeSaved ? '🔖 Saved to your list!' : 'Removed from Saved List',
      isError: false,
    });
    setTimeout(() => {
      setFeedback({ msg: '', isError: false });
    }, 2000);
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    setFeedback({ msg: '', isError: false });

    const result = await addToCart(product, 1);
    setIsAdding(false);

    if (result.success) {
      setFeedback({ msg: 'Added to cart!', isError: false });
    } else {
      setFeedback({ msg: result.error || 'Failed to add', isError: true });
    }

    setTimeout(() => {
      setFeedback({ msg: '', isError: false });
    }, 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-xs flex flex-col justify-between hover:border-primary/60 hover:shadow-md transition-all duration-200 group relative">
      <div>
        {/* Product Image Container */}
        <div className="h-44 bg-bg rounded-xl mb-3 overflow-hidden border border-border/40 relative flex items-center justify-center">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="text-4xl">🛍️</div>
          )}

          {/* Bookmark / Save for Later Button */}
          <button
            type="button"
            onClick={handleToggleSave}
            title={saved ? 'Remove from Saved List' : 'Save for Later'}
            className={`absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-xs ${
              saved
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-white/80 hover:bg-white text-gray-500 hover:text-accent'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>

          {/* Stock Badges */}
          <div className="absolute top-2 right-2">
            {isOutOfStock ? (
              <span className="px-2 py-0.5 rounded-full bg-error/90 text-white text-[10px] font-bold shadow-xs">
                Out of Stock
              </span>
            ) : product.stock <= 5 ? (
              <span className="px-2 py-0.5 rounded-full bg-accent/90 text-white text-[10px] font-bold shadow-xs">
                Only {product.stock} left
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-primary/90 text-white text-[10px] font-semibold shadow-xs">
                In Stock
              </span>
            )}
          </div>
        </div>

        {/* Product Name & Details */}
        <h3 className="font-bold text-text text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>{product.unit}</span>
          <span className="truncate max-w-[120px]">{product.categoryId?.name}</span>
        </div>
      </div>

      {/* Price & Action */}
      <div className="mt-4 pt-3 border-t border-border/60">
        <div className="flex items-baseline justify-between mb-2.5">
          <div>
            <span className="text-base sm:text-lg font-extrabold text-primary">
              ₹{Number(product.price).toFixed(2)}
            </span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-xs text-gray-400 line-through ml-1.5">
                ₹{Number(product.mrp).toFixed(2)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-accent font-bold uppercase tracking-wider">
            Best Price
          </span>
        </div>

        {feedback.msg && (
          <div
            className={`text-[11px] mb-2 p-1.5 rounded-lg text-center font-medium transition-all ${
              feedback.isError ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <button
          type="button"
          disabled={isOutOfStock || isAdding}
          onClick={handleAddToCart}
          className="w-full py-2 px-3 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs flex items-center justify-center gap-1.5"
        >
          {isAdding ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : isOutOfStock ? (
            'Unavailable'
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
