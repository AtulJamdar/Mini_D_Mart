import React from 'react';

export default function OrdersPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
        <h1 className="text-2xl font-bold text-text mb-1">My Orders</h1>
        <p className="text-sm text-gray-500 mb-6">Review your previous store purchases and delivery statuses.</p>

        <div className="p-8 text-center bg-bg rounded-xl border border-dashed border-border">
          <p className="text-gray-500 text-sm">No recent orders found.</p>
        </div>
      </div>
    </div>
  );
}
