import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import EmptyState from '../components/molecules/EmptyState';
import CartItemRow from '../components/cart/CartItemRow';

export default function CartPage() {
  const { cart, loading, actionLoading, error, clearError } = useCart();
  const navigate = useNavigate();

  if (loading && (!cart || cart.items.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          illustration="🛒"
          heading="No items in your cart"
          subtext="Browse from our wide variety of products & exciting offers"
          ctaLabel="START SHOPPING"
          onCtaClick={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Shopping Cart</h1>
          <p className="text-sm text-gray-500">
            {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your basket
          </p>
        </div>
        <Link
          to="/shop"
          className="text-xs font-semibold text-primary hover:underline"
        >
          + Continue Shopping
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="font-bold text-sm ml-2 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Item List using shared CartItemRow */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <CartItemRow
              key={item._id || item.productId}
              item={item}
              compact={false}
            />
          ))}
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-xs h-fit space-y-4">
          <h2 className="font-bold text-text text-base border-b border-border pb-3">
            Price Breakdown
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Items Total ({cart.itemCount})</span>
              <span className="font-medium text-text">₹{cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>GST & Taxes (5%)</span>
              <span className="font-medium text-text">₹{cart.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Fulfillment Fee</span>
              <span className="font-medium text-primary">FREE</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-base font-bold text-text">
              <span>Total Amount</span>
              <span className="text-primary text-lg">₹{cart.total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/checkout')}
            disabled={actionLoading}
            className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer text-sm shadow-xs flex items-center justify-center gap-2"
          >
            Proceed to Checkout &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
