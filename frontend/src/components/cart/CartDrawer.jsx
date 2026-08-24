import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import EmptyState from '../molecules/EmptyState';
import CartItemRow from './CartItemRow';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, loading, actionLoading } = useCart();
  const navigate = useNavigate();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isCartEmpty = !cart || cart.items.length === 0;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleStartShopping = () => {
    onClose();
    navigate('/shop');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel: full screen on mobile, max-w-md on sm+ */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Cart Drawer"
          className="w-screen max-w-full sm:max-w-md bg-white border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-text">My Basket</h2>
              {cart?.itemCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-bg hover:bg-gray-200 text-gray-500 hover:text-text flex items-center justify-center transition-colors cursor-pointer"
              title="Close cart"
              aria-label="Close cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {loading && isCartEmpty ? (
              <div className="flex items-center justify-center min-h-[30vh]">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : isCartEmpty ? (
              <div className="py-6">
                <EmptyState
                  illustration="🛒"
                  heading="No items in your cart"
                  subtext="Browse from our wide variety of products & exciting offers"
                  ctaLabel="START SHOPPING"
                  onCtaClick={handleStartShopping}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <CartItemRow
                    key={item._id || item.productId}
                    item={item}
                    compact={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {!isCartEmpty && (
            <div className="p-4 sm:p-5 border-t border-border bg-white space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-text">₹{cart?.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>GST & Taxes (5%)</span>
                  <span className="font-semibold text-text">₹{cart?.tax?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-text pt-2 border-t border-border">
                  <span>Estimated Total</span>
                  <span className="text-primary text-base font-extrabold">
                    ₹{cart?.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={actionLoading}
                  className="w-full py-3 px-4 bg-primary text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  Proceed to Checkout &rarr;
                </button>

                <div className="text-center">
                  <Link
                    to="/cart"
                    onClick={onClose}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View Full Cart Page
                  </Link>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
