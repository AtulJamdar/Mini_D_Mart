import React from 'react';

export default function AddStaffModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  stores = [],
  isSaving = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-text text-base">Add Staff Member</h3>
            <p className="text-xs text-gray-500">
              Create an operational staff account with automatic email invitation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-text font-bold text-lg cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-600 block mb-1">
                First Name <span className="text-error">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Aarav"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="font-bold text-gray-600 block mb-1">
                Last Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sharma"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-600 block mb-1">
              Email Address <span className="text-error">*</span>
            </label>
            <input
              required
              type="email"
              placeholder="staff.name@dmart.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-600 block mb-1">
                Role <span className="text-error">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary font-medium"
              >
                <option value="store_staff">Store Staff</option>
                <option value="store_manager">Store Manager</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-600 block mb-1">Assigned Store</label>
              <select
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary font-medium"
              >
                <option value="">Unassigned (HQ / All)</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-600 block mb-1">
              Password <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="password"
              minLength={6}
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary"
            />
            <p className="text-[11px] text-gray-500 mt-1 italic">
              ℹ️ Leave blank to auto-generate and email a secure random password.
            </p>
          </div>

          <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 text-[11px] text-primary space-y-1">
            <div className="font-bold">🔐 Security & Onboarding Defaults:</div>
            <ul className="list-disc list-inside space-y-0.5 text-gray-600">
              <li>Account will be created as <strong>Email Verified</strong> (Admin-vouched).</li>
              <li>Staff member will be prompted to reset password upon first login.</li>
              <li>Login URL and generated credentials will be dispatched to their email address.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-gray-500 rounded-xl hover:bg-bg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              {isSaving ? 'Creating & Sending Invite...' : 'Create & Invite Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
