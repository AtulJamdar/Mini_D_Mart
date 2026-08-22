import React, { useState } from 'react';
import api from '../services/api';

export default function StoreManagementTable({ stores = [], onUpdated }) {
  const [showModal, setShowModal] = useState(false);
  const [savingId, setSavingId] = useState(null);
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
        address: { street: formData.street, city: formData.city, state: formData.state, pincode: formData.pincode },
        geo: { type: 'Point', coordinates: [Number(formData.lng), Number(formData.lat)] },
      });
      if (res.data.success) {
        setMsg({ text: `Store "${res.data.data.name}" created!`, isError: false });
        setShowModal(false);
        setFormData({ name: '', street: '', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', lat: 19.076, lng: 72.8777 });
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create store', isError: true });
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
        <h3 className="text-sm font-bold text-text">Active Retail Stores ({stores.length})</h3>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          + Add Store Branch
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-bg border-b border-border text-gray-500 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Branch Name</th>
              <th className="py-3 px-4">Address</th>
              <th className="py-3 px-4">Geo Coordinates</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stores.map((s) => (
              <tr key={s._id} className="hover:bg-bg/40">
                <td className="py-3 px-4 font-bold text-text">{s.name}</td>
                <td className="py-3 px-4 text-gray-600">
                  {s.address?.street}, {s.address?.city} ({s.address?.pincode})
                </td>
                <td className="py-3 px-4 font-mono text-gray-500">
                  {s.geo?.coordinates?.join(', ') || 'N/A'}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.isActive ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                    {s.isActive ? 'Open' : 'Closed'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    disabled={savingId === s._id}
                    onClick={() => handleToggleActive(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                      s.isActive ? 'border-error/30 text-error hover:bg-error/10' : 'border-primary/30 text-primary hover:bg-primary/10'
                    }`}
                  >
                    {s.isActive ? 'Deactivate' : 'Activate'}
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
            <h3 className="font-bold text-text text-base">Add New Store Branch</h3>
            <form onSubmit={handleCreateStore} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Store Name</label>
                <input required type="text" placeholder="Mini D-Mart Andheri East" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text" />
              </div>
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Street Address</label>
                <input required type="text" placeholder="Shop 12, High Street" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">City</label>
                  <input required type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text" />
                </div>
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">State</label>
                  <input required type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text" />
                </div>
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">PIN</label>
                  <input required type="text" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border text-gray-500 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" disabled={savingId === 'creating'} className="px-5 py-2 bg-primary text-white font-bold rounded-lg cursor-pointer">{savingId === 'creating' ? 'Saving...' : 'Create Store'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
