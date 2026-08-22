import React, { useState } from 'react';
import api from '../services/api';

export default function CategoryManagementTable({ categories = [], onUpdated }) {
  const [showModal, setShowModal] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [msg, setMsg] = useState({ text: '', isError: false });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
  });

  const handleToggleActive = async (category) => {
    setSavingId(category._id);
    try {
      const res = await api.patch(`/categories/${category._id}`, { isActive: !category.isActive });
      if (res.data.success) {
        setMsg({ text: `Category "${category.name}" updated.`, isError: false });
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update category', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setSavingId('creating');
    setMsg({ text: '', isError: false });
    try {
      const res = await api.post('/categories', formData);
      if (res.data.success) {
        setMsg({ text: `Category "${res.data.data.name}" created!`, isError: false });
        setShowModal(false);
        setFormData({ name: '', description: '', imageUrl: '' });
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create category', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {msg.text && (
        <div className={`p-3 rounded-xl text-xs font-medium ${msg.isError ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-text">Product Categories ({categories.length})</h3>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          + Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-bg border-b border-border text-gray-500 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Category Name</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((c) => (
              <tr key={c._id} className="hover:bg-bg/40">
                <td className="py-3 px-4 font-bold text-text">{c.name}</td>
                <td className="py-3 px-4 text-gray-600">{c.description || '—'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isActive ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                    {c.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    disabled={savingId === c._id}
                    onClick={() => handleToggleActive(c)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                      c.isActive ? 'border-error/30 text-error hover:bg-error/10' : 'border-primary/30 text-primary hover:bg-primary/10'
                    }`}
                  >
                    {c.isActive ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-border space-y-4">
            <h3 className="font-bold text-text text-base">Add New Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Category Name</label>
                <input required type="text" placeholder="e.g. Frozen Foods" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text" />
              </div>
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Description</label>
                <textarea rows={2} placeholder="Ice creams, frozen peas, ready-to-cook meals..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border text-gray-500 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" disabled={savingId === 'creating'} className="px-5 py-2 bg-primary text-white font-bold rounded-lg cursor-pointer">{savingId === 'creating' ? 'Saving...' : 'Create Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
