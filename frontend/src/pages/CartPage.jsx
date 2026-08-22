import React from 'react';
import { Link } from 'react-router';

export default function CartPage() {
  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-border">
      <h1 className="text-2xl font-bold text-text mb-4">Your Shopping Cart</h1>
      
      <div className="p-8 text-center bg-bg rounded-xl border border-dashed border-border mb-6">
        <p className="text-gray-500 mb-4">Your shopping cart is currently empty.</p>
        <Link
          to="/shop"
          className="inline-block px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Start Shopping
        </Link>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-border">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider block">Estimated Total</span>
          <span className="text-xl font-bold text-text">₹0.00</span>
        </div>
        <button
          disabled
          className="px-6 py-2.5 bg-gray-500/20 text-gray-500 font-medium rounded-lg cursor-not-allowed text-sm"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
