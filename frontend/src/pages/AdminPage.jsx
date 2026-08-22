import React from 'react';

export default function AdminPage() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-border space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-text">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">System-wide settings, user roles, branches, and master product catalogs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-bg rounded-xl border border-border">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Revenue</div>
          <div className="text-2xl font-bold text-primary mt-1">₹0.00</div>
        </div>
        <div className="p-4 bg-bg rounded-xl border border-border">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Registered Users</div>
          <div className="text-2xl font-bold text-text mt-1">0</div>
        </div>
        <div className="p-4 bg-bg rounded-xl border border-border">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Active Products</div>
          <div className="text-2xl font-bold text-info mt-1">0</div>
        </div>
        <div className="p-4 bg-bg rounded-xl border border-border">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">System Errors</div>
          <div className="text-2xl font-bold text-error mt-1">0</div>
        </div>
      </div>
    </div>
  );
}
