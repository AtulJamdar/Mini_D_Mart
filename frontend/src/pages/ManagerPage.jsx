import React from 'react';

export default function ManagerPage() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-border space-y-4">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-text">Store Manager Portal</h1>
        <p className="text-sm text-gray-500">Inventory audits, restocking requests, and staff shifts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-bg rounded-xl border border-border">
          <div className="text-sm text-gray-500">Low Stock Alerts</div>
          <div className="text-2xl font-bold text-accent">0</div>
        </div>
        <div className="p-4 bg-bg rounded-xl border border-border">
          <div className="text-sm text-gray-500">Pending Approvals</div>
          <div className="text-2xl font-bold text-info">0</div>
        </div>
        <div className="p-4 bg-bg rounded-xl border border-border">
          <div className="text-sm text-gray-500">Daily Sales Summary</div>
          <div className="text-2xl font-bold text-primary">₹0.00</div>
        </div>
      </div>
    </div>
  );
}
