import React, { useState } from 'react';
import api from '../services/api';

export default function UserManagementTable({ users = [], stores = [], onUpdated }) {
  const [showModal, setShowModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [msg, setMsg] = useState({ text: '', isError: false });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'store_staff',
    phone: '',
    assignedStoreId: stores[0]?._id || '',
  });

  const handleToggleActive = async (user) => {
    setSavingId(user._id);
    try {
      const res = await api.patch(`/admin/users/${user._id}`, { isActive: !user.isActive });
      if (res.data.success) {
        setMsg({ text: `Account for ${user.name} is now ${!user.isActive ? 'Active' : 'Deactivated'}.`, isError: false });
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update user', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSavingId('creating');
    setMsg({ text: '', isError: false });
    try {
      const res = await api.post('/admin/users', formData);
      if (res.data.success) {
        setMsg({ text: `Staff account "${res.data.data.name}" created!`, isError: false });
        setShowModal(false);
        setFormData({ name: '', email: '', password: '', role: 'store_staff', phone: '', assignedStoreId: stores[0]?._id || '' });
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create user', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-4">
      {msg.text && (
        <div className={`p-3 rounded-xl text-xs font-medium ${msg.isError ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-2">
          {['', 'store_staff', 'store_manager', 'admin', 'customer'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                roleFilter === r ? 'bg-primary text-white shadow-xs' : 'bg-white text-gray-500 border border-border'
              }`}
            >
              {r ? r.replace(/_/g, ' ').toUpperCase() : 'ALL ROLES'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-white text-xs text-text focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs whitespace-nowrap"
          >
            + Create Account
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-bg border-b border-border text-gray-500 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Assigned Store</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => (
              <tr key={u._id} className="hover:bg-bg/40">
                <td className="py-3 px-4">
                  <div className="font-bold text-text">{u.name}</div>
                  <div className="text-[11px] text-gray-500">{u.email}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-primary/10 text-primary">
                    {u.role.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {u.assignedStoreId?.name || 'All / HQ'}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isActive ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                    {u.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    disabled={savingId === u._id}
                    onClick={() => handleToggleActive(u)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                      u.isActive ? 'border-error/30 text-error hover:bg-error/10' : 'border-primary/30 text-primary hover:bg-primary/10'
                    }`}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
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
            <h3 className="font-bold text-text text-base">Create Operational Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text" />
              </div>
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Email Address</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text" />
              </div>
              <div>
                <label className="font-bold text-gray-500 uppercase block mb-1">Password</label>
                <input required type="password" minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">Account Role</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text">
                    <option value="store_staff">Store Staff</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-500 uppercase block mb-1">Assigned Store</label>
                  <select value={formData.assignedStoreId} onChange={(e) => setFormData({ ...formData, assignedStoreId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text">
                    {stores.map((s) => (<option key={s._id} value={s._id}>{s.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border text-gray-500 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" disabled={savingId === 'creating'} className="px-5 py-2 bg-primary text-white font-bold rounded-lg cursor-pointer">{savingId === 'creating' ? 'Saving...' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
