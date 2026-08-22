import React, { useState } from 'react';
import api from '../services/api';

export default function InventoryTable({
  products = [],
  allowEdit = false,
  onStockUpdated,
}) {
  const [editingStock, setEditingStock] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ text: '', isError: false });

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
        setMsg({ text: 'Stock updated successfully!', isError: false });
        if (onStockUpdated) onStockUpdated(res.data.data);
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update stock', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Filter inventory by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-3.5 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none focus:border-primary shadow-xs"
        />
        <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">
          {filteredProducts.length} Products
        </span>
      </div>

      {msg.text && (
        <div
          className={`p-3 rounded-xl text-xs font-medium ${
            msg.isError ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg border-b border-border text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Stock Level</th>
                {allowEdit && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= 10;
                const isOut = p.stock <= 0;
                const currentEditVal = editingStock[p._id] !== undefined ? editingStock[p._id] : p.stock;
                const isSaving = savingId === p._id;

                return (
                  <tr key={p._id} className={isLow ? 'bg-error/5' : 'hover:bg-bg/50'}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text">{p.name}</div>
                      <div className="text-[11px] text-gray-500">{p.unit}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {p.categoryId?.name || 'General'}
                    </td>
                    <td className="py-3 px-4 font-bold text-text">
                      ₹{p.price.toFixed(2)}
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
                            OK
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
