import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cart, loading, actionLoading, updateQty, removeItem, error, clearError } = useCart();
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
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-border text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
          🛒
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">Your Cart is Empty</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Explore fresh vegetables, dairy, snacks, and essentials from Mini D-Mart.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:opacity-90 transition-opacity text-sm shadow-xs"
        >
          Browse Products
        </Link>
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
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <div
              key={item._id || item.productId}
              className="bg-white rounded-2xl border border-border p-4 shadow-xs flex gap-4 items-center"
            >
              {/* Product Image */}
              <div className="w-20 h-20 rounded-xl bg-bg border border-border/50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.images && item.images[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text text-sm truncate">{item.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Unit: {item.unit}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-primary">₹{item.price.toFixed(2)}</span>
                  {item.availableStock <= 5 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-semibold">
                      Only {item.availableStock} left
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-border rounded-lg bg-bg overflow-hidden">
                  <button
                    type="button"
                    disabled={actionLoading || item.qty <= 1}
                    onClick={() => updateQty(item.productId, item.qty - 1)}
                    className="px-2.5 py-1 text-sm font-bold text-gray-500 hover:text-text hover:bg-white transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-text min-w-[28px] text-center">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    disabled={actionLoading || item.qty >= item.availableStock}
                    onClick={() => updateQty(item.productId, item.qty + 1)}
                    className="px-2.5 py-1 text-sm font-bold text-gray-500 hover:text-text hover:bg-white transition-colors disabled:opacity-40 cursor-pointer"
                    title={item.qty >= item.availableStock ? 'Max stock reached' : 'Add 1'}
                  >
                    +
                  </button>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => removeItem(item.productId)}
                  className="p-1.5 text-gray-500 hover:text-error rounded-lg hover:bg-error/10 transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <span className="text-sm">🗑️</span>
                </button>
              </div>
            </div>
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
