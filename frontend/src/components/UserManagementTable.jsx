import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AddStaffModal from './AddStaffModal';
import EditStaffModal from './EditStaffModal';

export default function UserManagementTable({ stores = [], onUpdated }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [roleFilter, setRoleFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [msg, setMsg] = useState({ text: '', isError: false });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'store_staff',
    storeId: '',
    password: '',
  });

  const [editFormData, setEditFormData] = useState({
    role: 'store_staff',
    storeId: '',
    isActive: true,
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (storeFilter) params.storeId = storeFilter;
      if (search) params.search = search;

      const res = await api.get('/admin/staff', { params });
      if (res.data.success) {
        setStaffList(res.data.data.staff || []);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err.message);
      setMsg({ text: 'Failed to fetch staff members.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter, storeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStaff();
  };

  const handleToggleActive = async (staffMember) => {
    setSavingId(staffMember._id);
    try {
      const newStatus = !staffMember.isActive;
      const res = await api.patch(`/admin/staff/${staffMember._id}`, { isActive: newStatus });
      if (res.data.success) {
        setMsg({
          text: `Account for ${staffMember.name} has been ${newStatus ? 'activated' : 'deactivated'}.`,
          isError: false,
        });
        fetchStaff();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update staff status', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSavingId('creating');
    setMsg({ text: '', isError: false });
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        role: formData.role,
        storeId: formData.storeId || undefined,
      };

      if (formData.password && formData.password.trim().length > 0) {
        payload.password = formData.password.trim();
      }

      const res = await api.post('/admin/staff', payload);
      if (res.data.success) {
        const staffName = res.data.data.name;
        setMsg({
          text: `Staff account "${staffName}" created successfully! An invitation email with login details has been sent to ${formData.email}.`,
          isError: false,
        });
        setShowAddModal(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'store_staff',
          storeId: stores[0]?._id || '',
          password: '',
        });
        fetchStaff();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create staff account', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const handleOpenEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setEditFormData({
      role: staffMember.role,
      storeId: staffMember.assignedStoreId?._id || staffMember.assignedStoreId || '',
      isActive: staffMember.isActive,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setSavingId('editing');
    try {
      const res = await api.patch(`/admin/staff/${editingStaff._id}`, {
        role: editFormData.role,
        storeId: editFormData.storeId || null,
        isActive: editFormData.isActive,
      });
      if (res.data.success) {
        setMsg({
          text: `Updated profile for "${editingStaff.name}".`,
          isError: false,
        });
        setEditingStaff(null);
        fetchStaff();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update staff member', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  // Metrics
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.isActive).length;
  const managerCount = staffList.filter((s) => s.role === 'store_manager').length;
  const counterStaffCount = staffList.filter((s) => s.role === 'store_staff').length;

  return (
    <div className="space-y-4">
      {msg.text && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs ${
            msg.isError ? 'bg-error/10 text-error border border-error/20' : 'bg-primary/10 text-primary border border-primary/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{msg.isError ? '⚠️' : '✅'}</span>
            <span>{msg.text}</span>
          </div>
          <button
            onClick={() => setMsg({ text: '', isError: false })}
            className="text-xs opacity-70 hover:opacity-100 font-bold ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-border">
          <div className="text-[10px] font-bold uppercase text-gray-500">Total Staff</div>
          <div className="text-lg font-bold text-text mt-0.5">{totalStaff}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-border">
          <div className="text-[10px] font-bold uppercase text-gray-500">Active Status</div>
          <div className="text-lg font-bold text-primary mt-0.5">{activeStaff}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-border">
          <div className="text-[10px] font-bold uppercase text-gray-500">Store Managers</div>
          <div className="text-lg font-bold text-accent mt-0.5">{managerCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-border">
          <div className="text-[10px] font-bold uppercase text-gray-500">Counter & Fulfillment Staff</div>
          <div className="text-lg font-bold text-info mt-0.5">{counterStaffCount}</div>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-border">
            {[
              { id: '', label: 'All Roles' },
              { id: 'store_staff', label: 'Store Staff' },
              { id: 'store_manager', label: 'Store Manager' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  roleFilter === r.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-500 hover:text-text hover:bg-bg'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-white text-xs text-text focus:outline-none focus:border-primary font-medium"
          >
            <option value="">All Store Locations</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.code || s.address?.city})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1 sm:w-64">
            <div className="relative">
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3.5 py-2 pl-8 rounded-xl border border-border bg-white text-xs text-text focus:outline-none focus:border-primary"
              />
              <span className="absolute left-2.5 top-2.5 text-xs text-gray-400">🔍</span>
            </div>
          </form>

          <button
            onClick={() => {
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                role: 'store_staff',
                storeId: stores[0]?._id || '',
                password: '',
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-1.5"
          >
            <span>+</span> Add Staff Member
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            <div className="text-3xl mb-2">👥</div>
            <p className="font-semibold text-text">No staff accounts found</p>
            <p className="mt-1">Try adjusting your filters or click "+ Add Staff Member" to onboard a new employee.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-bg border-b border-border text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Assigned Store</th>
                  <th className="py-3.5 px-4">Account Security</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffList.map((u) => (
                  <tr key={u._id} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-text text-sm">{u.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                          u.role === 'store_manager'
                            ? 'bg-accent/10 text-accent border border-accent/20'
                            : 'bg-info/10 text-info border border-info/20'
                        }`}
                      >
                        {u.role === 'store_manager' ? 'Store Manager' : 'Store Staff'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-medium">
                      {u.assignedStoreId ? (
                        <div>
                          <span className="font-semibold">{u.assignedStoreId.name}</span>
                          {u.assignedStoreId.address?.city && (
                            <span className="text-[11px] text-gray-400 block">
                              📍 {u.assignedStoreId.address.city}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned (HQ / All)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[11px] text-emerald-700 font-medium">Admin Vouched</span>
                      </div>
                      {u.mustChangePassword && (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold">
                          🔑 Password Reset Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-error/10 text-error border border-error/20'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-border text-gray-600 hover:bg-bg transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          disabled={savingId === u._id}
                          onClick={() => handleToggleActive(u)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            u.isActive
                              ? 'border-error/30 text-error hover:bg-error/10'
                              : 'border-primary/30 text-primary hover:bg-primary/10'
                          }`}
                        >
                          {savingId === u._id
                            ? 'Saving...'
                            : u.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateStaff}
        formData={formData}
        setFormData={setFormData}
        stores={stores}
        isSaving={savingId === 'creating'}
      />

      <EditStaffModal
        staff={editingStaff}
        onClose={() => setEditingStaff(null)}
        onSubmit={handleSaveEdit}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        stores={stores}
        isSaving={savingId === 'editing'}
      />
    </div>
  );
}
