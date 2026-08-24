import React, { useState } from 'react';
import api from '../services/api';

export default function CategoryManagementTable({ categories = [], onUpdated }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [msg, setMsg] = useState({ text: '', isError: false });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true,
  });

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setEditFormData({
      name: category.name || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      isActive: category.isActive !== false,
    });
  };

  const handleToggleActive = async (category) => {
    setSavingId(category._id);
    try {
      const res = await api.patch(`/categories/${category._id}`, { isActive: !category.isActive });
      if (res.data.success) {
        setMsg({
          text: `Category "${category.name}" is now ${!category.isActive ? 'Active' : 'Disabled'}.`,
          isError: false,
        });
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
        setMsg({ text: `Category "${res.data.data.name}" created successfully!`, isError: false });
        setShowAddModal(false);
        setFormData({ name: '', description: '', imageUrl: '' });
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create category', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    setSavingId('editing');
    setMsg({ text: '', isError: false });
    try {
      const res = await api.patch(`/categories/${editingCategory._id}`, editFormData);
      if (res.data.success) {
        setMsg({ text: `Category "${res.data.data.name}" updated successfully!`, isError: false });
        setEditingCategory(null);
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update category', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setSavingId('deleting');
    setMsg({ text: '', isError: false });
    try {
      const res = await api.delete(`/categories/${deletingCategory._id}`);
      if (res.data.success) {
        setMsg({ text: `Category "${deletingCategory.name}" was deleted successfully.`, isError: false });
        setDeletingCategory(null);
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to delete category', isError: true });
      setDeletingCategory(null);
    } finally {
      setSavingId(null);
    }
  };

  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && c.isActive) ||
      (statusFilter === 'disabled' && !c.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {msg.text && (
        <div className={`p-3 rounded-xl text-xs font-medium ${msg.isError ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
          {msg.text}
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search category name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-1.5 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:border-primary"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:border-primary"
          >
            <option value="all">All Categories ({categories.length})</option>
            <option value="active">Active Only ({categories.filter((c) => c.isActive).length})</option>
            <option value="disabled">Disabled Only ({categories.filter((c) => !c.isActive).length})</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
        >
          <span>+</span> Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-bg border-b border-border text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    No categories found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => (
                  <tr key={c._id} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0 border border-primary/20">
                          {c.imageUrl ? (
                            <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            c.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-text text-sm">{c.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono">ID: {c._id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-sm">
                      {c.description ? (
                        <span className="line-clamp-2">{c.description}</span>
                      ) : (
                        <span className="text-gray-400 italic">No description provided</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-primary' : 'bg-error'}`} />
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="px-3 py-1 bg-bg hover:bg-border text-text text-xs font-semibold rounded-lg border border-border cursor-pointer transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          disabled={savingId === c._id}
                          onClick={() => handleToggleActive(c)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                            c.isActive
                              ? 'border-error/30 text-error hover:bg-error/10'
                              : 'border-primary/30 text-primary hover:bg-primary/10'
                          }`}
                        >
                          {c.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => setDeletingCategory(c)}
                          className="px-2.5 py-1 text-gray-400 hover:text-error hover:bg-error/10 text-xs rounded-lg cursor-pointer transition-colors"
                          title="Delete Category"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text text-base">Add New Product Category</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-text font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Category Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Frozen Foods, Fresh Produce"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the items in this category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border text-gray-500 rounded-xl hover:bg-bg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingId === 'creating'}
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {savingId === 'creating' ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-text text-base">Edit Category</h3>
                <span className="text-[11px] text-gray-400 font-mono">ID: {editingCategory._id}</span>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-gray-400 hover:text-text font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Category Name *</label>
                <input
                  required
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Image URL</label>
                <input
                  type="url"
                  value={editFormData.imageUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Category Status</label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="catStatus"
                      checked={editFormData.isActive === true}
                      onChange={() => setEditFormData({ ...editFormData, isActive: true })}
                      className="accent-primary"
                    />
                    <span className="font-semibold text-text">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="catStatus"
                      checked={editFormData.isActive === false}
                      onChange={() => setEditFormData({ ...editFormData, isActive: false })}
                      className="accent-error"
                    />
                    <span className="font-semibold text-text">Disabled</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border border-border text-gray-500 rounded-xl hover:bg-bg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingId === 'editing'}
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {savingId === 'editing' ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-border space-y-4">
            <h3 className="font-bold text-text text-base">Delete Category?</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete <strong className="text-text">"{deletingCategory.name}"</strong>? This action cannot be undone. Categories with active products cannot be deleted.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 border border-border text-gray-500 rounded-xl hover:bg-bg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingId === 'deleting'}
                onClick={handleDeleteCategory}
                className="px-5 py-2 bg-error text-white font-bold rounded-xl hover:opacity-90 text-xs cursor-pointer disabled:opacity-50"
              >
                {savingId === 'deleting' ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
