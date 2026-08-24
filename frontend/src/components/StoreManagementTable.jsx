import React, { useState } from 'react';
import api from '../services/api';

export default function StoreManagementTable({ stores = [], onUpdated }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [msg, setMsg] = useState({ text: '', isError: false });

  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    lat: 19.076,
    lng: 72.8777,
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    lat: '',
    lng: '',
    isActive: true,
  });

  const handleOpenEdit = (store) => {
    setEditingStore(store);
    setEditFormData({
      name: store.name || '',
      street: store.address?.street || '',
      city: store.address?.city || 'Mumbai',
      state: store.address?.state || 'Maharashtra',
      pincode: store.address?.pincode || '400001',
      lng: store.geo?.coordinates?.[0] ?? 72.8777,
      lat: store.geo?.coordinates?.[1] ?? 19.076,
      isActive: store.isActive !== false,
    });
  };

  const handleToggleActive = async (store) => {
    setSavingId(store._id);
    try {
      const res = await api.patch(`/stores/${store._id}`, { isActive: !store.isActive });
      if (res.data.success) {
        setMsg({ text: `Store "${store.name}" is now ${!store.isActive ? 'Active' : 'Deactivated'}.`, isError: false });
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update store', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setSavingId('creating');
    setMsg({ text: '', isError: false });
    try {
      const res = await api.post('/stores', {
        name: formData.name,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        geo: {
          type: 'Point',
          coordinates: [Number(formData.lng), Number(formData.lat)],
        },
      });
      if (res.data.success) {
        setMsg({ text: `Store "${res.data.data.name}" created successfully with auto-configured pickup slots!`, isError: false });
        setShowAddModal(false);
        setFormData({ name: '', street: '', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', lat: 19.076, lng: 72.8777 });
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create store', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    if (!editingStore) return;
    setSavingId('editing');
    setMsg({ text: '', isError: false });
    try {
      const res = await api.patch(`/stores/${editingStore._id}`, {
        name: editFormData.name,
        address: {
          street: editFormData.street,
          city: editFormData.city,
          state: editFormData.state,
          pincode: editFormData.pincode,
        },
        geo: {
          type: 'Point',
          coordinates: [Number(editFormData.lng), Number(editFormData.lat)],
        },
        isActive: editFormData.isActive,
      });
      if (res.data.success) {
        setMsg({ text: `Store "${res.data.data.name}" updated successfully!`, isError: false });
        setEditingStore(null);
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update store', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.address?.city && s.address.city.toLowerCase().includes(search.toLowerCase())) ||
      (s.address?.street && s.address.street.toLowerCase().includes(search.toLowerCase())) ||
      (s.address?.pincode && s.address.pincode.includes(search));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.isActive) ||
      (statusFilter === 'inactive' && !s.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {msg.text && (
        <div className={`p-3 rounded-xl text-xs font-medium ${msg.isError ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
          {msg.text}
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search branch name, street, city, pin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-1.5 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:border-primary"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-border bg-bg text-xs text-text focus:outline-none focus:border-primary"
          >
            <option value="all">All Statuses ({stores.length})</option>
            <option value="active">Active Only ({stores.filter((s) => s.isActive).length})</option>
            <option value="inactive">Inactive Only ({stores.filter((s) => !s.isActive).length})</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
        >
          <span>+</span> Add Store Branch
        </button>
      </div>

      {/* Stores Table */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-bg border-b border-border text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Branch Details</th>
                <th className="py-3 px-4">Address & City</th>
                <th className="py-3 px-4">Geo Coordinates</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No store branches found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStores.map((s) => (
                  <tr key={s._id} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-text text-sm">{s.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">ID: {s._id}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="font-medium text-text">{s.address?.street || '—'}</div>
                      <div className="text-[11px] text-gray-500">
                        {s.address?.city}, {s.address?.state} - {s.address?.pincode}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                      {s.geo?.coordinates?.length === 2 ? (
                        <span>
                          [{s.geo.coordinates[0]?.toFixed(4)}, {s.geo.coordinates[1]?.toFixed(4)}]
                        </span>
                      ) : (
                        <span className="text-gray-400">Default</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.isActive ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-primary' : 'bg-error'}`} />
                        {s.isActive ? 'Active / Open' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="px-3 py-1 bg-bg hover:bg-border text-text text-xs font-semibold rounded-lg border border-border cursor-pointer transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          disabled={savingId === s._id}
                          onClick={() => handleToggleActive(s)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                            s.isActive
                              ? 'border-error/30 text-error hover:bg-error/10'
                              : 'border-primary/30 text-primary hover:bg-primary/10'
                          }`}
                        >
                          {s.isActive ? 'Deactivate' : 'Activate'}
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

      {/* Add Store Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text text-base">Add New Store Branch</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-text font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Store / Branch Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Mini D-Mart Andheri West"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Street Address *</label>
                <input
                  required
                  type="text"
                  placeholder="Shop 12, Link Road, Near Metro"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">City *</label>
                  <input
                    required
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">State *</label>
                  <input
                    required
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">PIN *</label>
                  <input
                    required
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-bg rounded-xl text-[11px] text-gray-500">
                💡 Standard pickup slots will be automatically provisioned for this branch upon creation.
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
                  {savingId === 'creating' ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-text text-base">Edit Store Branch</h3>
                <span className="text-[11px] text-gray-400 font-mono">ID: {editingStore._id}</span>
              </div>
              <button
                onClick={() => setEditingStore(null)}
                className="text-gray-400 hover:text-text font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateStore} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Store / Branch Name *</label>
                <input
                  required
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Street Address *</label>
                <input
                  required
                  type="text"
                  value={editFormData.street}
                  onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">City *</label>
                  <input
                    required
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">State *</label>
                  <input
                    required
                    type="text"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">PIN *</label>
                  <input
                    required
                    type="text"
                    value={editFormData.pincode}
                    onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editFormData.lat}
                    onChange={(e) => setEditFormData({ ...editFormData, lat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editFormData.lng}
                    onChange={(e) => setEditFormData({ ...editFormData, lng: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Branch Status</label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editFormData.isActive === true}
                      onChange={() => setEditFormData({ ...editFormData, isActive: true })}
                      className="accent-primary"
                    />
                    <span className="font-semibold text-text">Active / Open</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editFormData.isActive === false}
                      onChange={() => setEditFormData({ ...editFormData, isActive: false })}
                      className="accent-error"
                    />
                    <span className="font-semibold text-text">Deactivated</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
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
    </div>
  );
}
