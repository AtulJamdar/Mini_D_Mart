import React from 'react';

export default function EditStaffModal({
  staff,
  onClose,
  onSubmit,
  editFormData,
  setEditFormData,
  stores = [],
  isSaving = false,
}) {
  if (!staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-text text-base">Edit Staff Member</h3>
            <p className="text-xs text-gray-500">{staff.name} ({staff.email})</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-text font-bold text-lg cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-gray-600 block mb-1">Role Assignment</label>
            <select
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary font-medium"
            >
              <option value="store_staff">Store Staff</option>
              <option value="store_manager">Store Manager</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-gray-600 block mb-1">Assigned Store / Branch</label>
            <select
              value={editFormData.storeId}
              onChange={(e) => setEditFormData({ ...editFormData, storeId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text focus:outline-none focus:border-primary font-medium"
            >
              <option value="">Unassigned (HQ / All)</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code || s.address?.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editFormData.isActive}
              onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="editIsActive" className="text-xs font-semibold text-text cursor-pointer">
              Account Active (Able to log in and fulfill store orders)
            </label>
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
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
