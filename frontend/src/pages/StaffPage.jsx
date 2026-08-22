import React from 'react';

export default function StaffPage() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-border space-y-4">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-text">Staff Counter & POS</h1>
        <p className="text-sm text-gray-500">Fast checkout, item barcode scanning, and receipt generation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-bg rounded-xl border border-border">
          <h3 className="font-semibold text-text mb-2">Barcode Scanner / Item Lookup</h3>
          <input
            type="text"
            placeholder="Scan barcode or enter SKU..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm"
            disabled
          />
        </div>
        <div className="p-4 bg-bg rounded-xl border border-border">
          <h3 className="font-semibold text-text mb-2">Current Register Total</h3>
          <div className="text-2xl font-bold text-primary">₹0.00</div>
          <span className="text-xs text-gray-500">Items: 0</span>
        </div>
      </div>
    </div>
  );
}
