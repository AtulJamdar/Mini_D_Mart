import React from 'react';
import { Link } from 'react-router';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm border border-border">
        <h1 className="text-3xl font-bold text-primary mb-2">Welcome to Mini D-Mart</h1>
        <p className="text-gray-500 mb-6">
          Your one-stop smart grocery and retail management system.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/shop"
            className="p-4 rounded-xl border border-border hover:border-primary transition-colors bg-bg/50"
          >
            <h3 className="font-semibold text-text">Customer Shop</h3>
            <p className="text-xs text-gray-500 mt-1">Browse products & add to cart</p>
          </Link>
          <Link
            to="/orders"
            className="p-4 rounded-xl border border-border hover:border-primary transition-colors bg-bg/50"
          >
            <h3 className="font-semibold text-text">My Orders</h3>
            <p className="text-xs text-gray-500 mt-1">Track purchase history</p>
          </Link>
          <Link
            to="/staff"
            className="p-4 rounded-xl border border-border hover:border-primary transition-colors bg-bg/50"
          >
            <h3 className="font-semibold text-text">Staff Counter</h3>
            <p className="text-xs text-gray-500 mt-1">Cashier & POS billing</p>
          </Link>
          <Link
            to="/admin"
            className="p-4 rounded-xl border border-border hover:border-primary transition-colors bg-bg/50"
          >
            <h3 className="font-semibold text-text">Admin Panel</h3>
            <p className="text-xs text-gray-500 mt-1">Store management & analytics</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
