import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AccountSidebar from '../components/account/AccountSidebar';
import AddCard from '../components/molecules/AddCard';

export default function MyAddressPage() {
  const { user, refreshUser } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState({ text: '', isError: false });

  const [formData, setFormData] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '',
    isDefault: false,
  });

  const addresses = user?.addresses || [];

  const handleOpenAddForm = () => {
    setFormData({
      label: 'Home',
      line1: '',
      line2: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: user?.phone || '',
      isDefault: addresses.length === 0,
    });
    setFeedback({ text: '', isError: false });
    setIsAdding(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setFeedback({ text: '', isError: false });
    setLoading(true);

    try {
      const res = await api.post('/auth/addresses', {
        label: formData.label,
        addressLine1: formData.line1,
        addressLine2: formData.line2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        phone: formData.phone,
        isDefault: formData.isDefault,
      });

      if (res.data.success) {
        setFeedback({ text: 'Address added successfully!', isError: false });
        setIsAdding(false);
        if (refreshUser) await refreshUser();
      }
    } catch (err) {
      setFeedback({
        text: err.response?.data?.message || err.message || 'Failed to save address',
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this delivery address?')) return;
    setDeletingId(id);
    setFeedback({ text: '', isError: false });

    try {
      const res = await api.delete(`/auth/addresses/${id}`);
      if (res.data.success) {
        setFeedback({ text: 'Address removed.', isError: false });
        if (refreshUser) await refreshUser();
      }
    } catch (err) {
      setFeedback({
        text: err.response?.data?.message || err.message || 'Failed to delete address',
        isError: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      <AccountSidebar />

      <main className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">My Addresses</h1>
            <p className="text-sm text-gray-500">Manage saved delivery addresses for express checkout.</p>
          </div>
          {!isAdding && addresses.length > 0 && (
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity w-fit cursor-pointer"
            >
              + Add Address
            </button>
          )}
        </div>

        {feedback.text && (
          <div
            className={`p-4 rounded-xl text-xs font-medium ${
              feedback.isError
                ? 'bg-error/10 border border-error/20 text-error'
                : 'bg-primary/10 border border-primary/20 text-primary'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Address Form */}
        {isAdding && (
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h2 className="font-bold text-base text-text">Add New Delivery Address</h2>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-gray-400 hover:text-text cursor-pointer"
              >
                &times; Close
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 max-w-xl">
              {/* Address Label (Home, Work, Other) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Address Type / Label
                </label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setFormData({ ...formData, label: l })}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        formData.label === l
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-bg text-gray-600 hover:bg-gray-200 border border-border'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line 1 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Flat, House no., Building, Apartment <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  placeholder="e.g. Flat 402, Sai Residency"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-primary shadow-2xs"
                />
              </div>

              {/* Line 2 / Landmark */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Area, Street, Sector, Village <span className="text-gray-400 lowercase font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.line2}
                  onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                  placeholder="e.g. Near City Mall, MG Road"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-primary shadow-2xs"
                />
              </div>

              {/* City, State, PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    City <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-primary shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    State <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-primary shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    PIN Code <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="e.g. 400001"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-primary shadow-2xs"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-primary shadow-2xs"
                />
              </div>

              {/* Default Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-xs font-medium text-text cursor-pointer">
                  Make this my default delivery address
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving Address...' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2.5 border border-border bg-white text-xs font-semibold text-gray-500 rounded-xl hover:bg-bg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State with AddCard */}
        {!isAdding && addresses.length === 0 && (
          <div className="space-y-4">
            <div className="max-w-md mx-auto">
              <AddCard
                title="+ ADD NEW ADDRESS"
                subtitle="Add your home, office, or other delivery addresses for fast 1-click checkout."
                onClick={handleOpenAddForm}
              />
            </div>
          </div>
        )}

        {/* Saved Addresses List */}
        {!isAdding && addresses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => {
              const isDeleting = deletingId === addr._id;
              return (
                <div
                  key={addr._id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-3 relative ${
                    addr.isDefault ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                        {addr.label || 'Home'}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold uppercase text-primary tracking-wide">
                          ✓ Default Address
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-text leading-snug">
                      {addr.addressLine1}
                      {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      {addr.city}, {addr.state} - <span className="font-mono font-medium text-text">{addr.pincode}</span>
                    </div>

                    {addr.phone && (
                      <div className="text-[11px] text-gray-400 mt-1">
                        📞 {addr.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70 text-xs">
                    <button
                      disabled={isDeleting}
                      onClick={() => handleDeleteAddress(addr._id)}
                      className="text-error hover:underline cursor-pointer disabled:opacity-50 text-xs font-semibold"
                    >
                      {isDeleting ? 'Removing...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Card to add another address */}
            <AddCard
              title="+ ADD NEW ADDRESS"
              subtitle="Add another address"
              onClick={handleOpenAddForm}
            />
          </div>
        )}
      </main>
    </div>
  );
}
