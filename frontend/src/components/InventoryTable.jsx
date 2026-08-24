import React, { useState, useMemo } from 'react';
import api from '../services/api';

export default function InventoryTable({
  products = [],
  stores = [],
  categories = [],
  allowEdit = false,
  onStockUpdated,
  selectedStoreId = '',
  onStoreChange,
  showStoreFilter = true,
}) {
  const [editingStock, setEditingStock] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');
  const [internalStoreFilter, setInternalStoreFilter] = useState(selectedStoreId || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [msg, setMsg] = useState({ text: '', isError: false });

  const activeStoreFilter = onStoreChange ? selectedStoreId : internalStoreFilter;

  // Extract unique stores from products if stores prop is empty
  const availableStores = useMemo(() => {
    if (stores && stores.length > 0) return stores;
    const storeMap = new Map();
    products.forEach((p) => {
      if (p.storeId && p.storeId._id) {
        storeMap.set(p.storeId._id, p.storeId);
      }
    });
    return Array.from(storeMap.values());
  }, [stores, products]);

  // Extract unique categories from products if categories prop is empty
  const availableCategories = useMemo(() => {
    if (categories && categories.length > 0) return categories;
    const catMap = new Map();
    products.forEach((p) => {
      if (p.categoryId && p.categoryId._id) {
        catMap.set(p.categoryId._id, p.categoryId);
      }
    });
    return Array.from(catMap.values());
  }, [categories, products]);

  const handleStockChange = (id, val) => {
    setEditingStock((prev) => ({ ...prev, [id]: val }));
  };

  const handleSaveStock = async (id) => {
    const stockVal = editingStock[id];
    if (stockVal === undefined || stockVal === '') return;

    setSavingId(id);
    setMsg({ text: '', isError: false });
    try {
      const res = await api.patch(`/products/${id}/stock`, {
        stock: Number(stockVal),
      });
      if (res.data.success) {
        setMsg({ text: `Stock for "${res.data.data.name}" updated successfully!`, isError: false });
        if (onStockUpdated) onStockUpdated(res.data.data);
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update stock', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const handleStoreFilterChange = (val) => {
    if (onStoreChange) {
      onStoreChange(val);
    } else {
      setInternalStoreFilter(val);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());

      const productStoreId = p.storeId?._id || p.storeId;
      const matchesStore =
        !activeStoreFilter ||
        String(productStoreId) === String(activeStoreFilter);

      const productCatId = p.categoryId?._id || p.categoryId;
      const matchesCategory =
        !categoryFilter ||
        String(productCatId) === String(categoryFilter);

      let matchesStock = true;
      if (stockStatusFilter === 'low') matchesStock = p.stock > 0 && p.stock <= 10;
      if (stockStatusFilter === 'out') matchesStock = p.stock <= 0;
      if (stockStatusFilter === 'ok') matchesStock = p.stock > 10;

      return matchesSearch && matchesStore && matchesCategory && matchesStock;
    });
  }, [products, search, activeStoreFilter, categoryFilter, stockStatusFilter]);

  // Inventory Summary Stats
  const stats = useMemo(() => {
    let totalItems = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalQuantity = 0;

    filteredProducts.forEach((p) => {
      totalItems += 1;
      totalQuantity += p.stock || 0;
      if (p.stock <= 0) outOfStockCount += 1;
      else if (p.stock <= 10) lowStockCount += 1;
    });

    return { totalItems, lowStockCount, outOfStockCount, totalQuantity };
  }, [filteredProducts]);

  return (
    <div className="space-y-4">
      {msg.text && (
        <div
          className={`p-3 rounded-xl text-xs font-medium ${
            msg.isError ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-border shadow-xs">
          <div className="text-[10px] font-bold uppercase text-gray-500">Filtered SKUs</div>
          <div className="text-lg font-bold text-text mt-0.5">{stats.totalItems}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-border shadow-xs">
          <div className="text-[10px] font-bold uppercase text-gray-500">Total Units</div>
          <div className="text-lg font-bold text-primary mt-0.5">{stats.totalQuantity}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-border shadow-xs">
          <div className="text-[10px] font-bold uppercase text-gray-500">Low Stock (≤10)</div>
          <div className={`text-lg font-bold mt-0.5 ${stats.lowStockCount > 0 ? 'text-accent' : 'text-text'}`}>
            {stats.lowStockCount}
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-border shadow-xs">
          <div className="text-[10px] font-bold uppercase text-gray-500">Out of Stock</div>
          <div className={`text-lg font-bold mt-0.5 ${stats.outOfStockCount > 0 ? 'text-error' : 'text-text'}`}>
            {stats.outOfStockCount}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search by name */}
          <input
            type="text"
            placeholder="Search catalog product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 px-3.5 py-1.5 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:border-primary"
          />

          {/* Store Filter (Global Multi-store support) */}
          {showStoreFilter && (
            <select
              value={activeStoreFilter}
              onChange={(e) => handleStoreFilterChange(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:border-primary font-medium"
            >
              <option value="">🏪 All Stores (Global Cross-Branch)</option>
              {availableStores.map((s) => (
                <option key={s._id} value={s._id}>
                  🏪 {s.name} ({s.address?.city || 'Local'})
                </option>
              ))}
            </select>
          )}

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:border-primary font-medium"
          >
            <option value="">🏷️ All Categories</option>
            {availableCategories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Level Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:border-primary font-medium"
          >
            <option value="all">📊 All Stock Levels</option>
            <option value="low">⚠️ Low Stock (≤10 units)</option>
            <option value="out">🛑 Out of Stock (0 units)</option>
            <option value="ok">✅ Adequate Stock (&gt;10)</option>
          </select>
        </div>

        <span className="text-xs text-gray-500 font-semibold whitespace-nowrap self-end md:self-center">
          Showing {filteredProducts.length} of {products.length} Products
        </span>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-bg border-b border-border text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Branch / Store</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Stock Level</th>
                {allowEdit && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={allowEdit ? 6 : 5} className="py-8 text-center text-gray-400">
                    No products found matching the selected store or search filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= 10 && p.stock > 0;
                  const isOut = p.stock <= 0;
                  const currentEditVal =
                    editingStock[p._id] !== undefined ? editingStock[p._id] : p.stock;
                  const isSaving = savingId === p._id;
                  const storeName = p.storeId?.name || 'Main Branch';
                  const storeCity = p.storeId?.address?.city;

                  return (
                    <tr
                      key={p._id}
                      className={
                        isOut
                          ? 'bg-error/5 hover:bg-error/10 transition-colors'
                          : isLow
                          ? 'bg-accent/5 hover:bg-accent/10 transition-colors'
                          : 'hover:bg-bg/40 transition-colors'
                      }
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text">{p.name}</div>
                        <div className="text-[11px] text-gray-500">{p.unit}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-text">{storeName}</div>
                        {storeCity && (
                          <div className="text-[10px] text-gray-400 font-mono">{storeCity}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {p.categoryId?.name || 'General'}
                      </td>
                      <td className="py-3 px-4 font-bold text-text">
                        ₹{p.price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {allowEdit ? (
                            <input
                              type="number"
                              min="0"
                              value={currentEditVal}
                              onChange={(e) => handleStockChange(p._id, e.target.value)}
                              className="w-20 px-2 py-1 rounded-lg border border-border bg-white text-xs font-bold text-text focus:border-primary focus:outline-none"
                            />
                          ) : (
                            <span className="font-bold text-text">{p.stock} units</span>
                          )}

                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full bg-error text-white text-[10px] font-bold">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold">
                              Low Stock ({p.stock})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              In Stock
                            </span>
                          )}
                        </div>
                      </td>
                      {allowEdit && (
                        <td className="py-3 px-4 text-right">
                          <button
                            disabled={isSaving || String(currentEditVal) === String(p.stock)}
                            onClick={() => handleSaveStock(p._id)}
                            className="px-3 py-1 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-30 text-xs shadow-xs"
                          >
                            {isSaving ? 'Saving...' : 'Save Stock'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
