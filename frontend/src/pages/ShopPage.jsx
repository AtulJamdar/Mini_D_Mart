import React from 'react';

export default function ShopPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Browse Products</h1>
          <p className="text-sm text-gray-500">Explore fresh groceries, household items, and more.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
            Store Open
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="bg-white rounded-xl border border-border p-4 shadow-sm flex flex-col justify-between"
          >
            <div className="h-36 bg-bg rounded-lg mb-4 flex items-center justify-center text-gray-500 text-sm">
              Product Placeholder {item}
            </div>
            <div>
              <h3 className="font-semibold text-text">D-Mart Grocery Item #{item}</h3>
              <p className="text-xs text-gray-500 mb-2">Category: Daily Essentials</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-primary">₹{(item * 49.99).toFixed(2)}</span>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
