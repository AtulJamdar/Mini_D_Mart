import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import AccountSidebar from '../components/account/AccountSidebar';

export default function MyProfilePage() {
  const { user, updateProfile, deleteAccount, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    if (user) {
      const parts = (user.name || '').trim().split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: '', isError: false });
    setLoading(true);

    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
      });
      setStatusMsg({ text: 'Profile updated successfully!', isError: false });
      if (refreshUser) await refreshUser();
    } catch (err) {
      setStatusMsg({
        text: err.message || 'Failed to update profile. Please try again.',
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action is irreversible.'
    );
    if (!confirmed) return;

    try {
      await deleteAccount();
      navigate('/');
    } catch (err) {
      setStatusMsg({
        text: err.message || 'Failed to delete account.',
        isError: true,
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      <AccountSidebar />

      <main className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">My Profile</h1>
          <p className="text-sm text-gray-500">Manage your personal information and account settings.</p>
        </div>

        {statusMsg.text && (
          <div
            className={`p-4 rounded-xl text-xs font-medium ${
              statusMsg.isError
                ? 'bg-error/10 border border-error/20 text-error'
                : 'bg-primary/10 border border-primary/20 text-primary'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
            {/* Mobile Number (Read-only) with Change Link */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Mobile Number
                </label>
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(true)}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Change Mobile Number
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user?.phone || 'Not registered via phone'}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg/80 text-gray-600 text-sm font-medium cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 text-xs font-semibold text-gray-400">
                  🔒 Verified
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Your registered mobile number is used for login OTPs and order status updates.
              </p>
            </div>

            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  First Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-primary shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Last Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Sharma"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-primary shadow-2xs"
                />
              </div>
            </div>

            {/* Email Address (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-gray-400 lowercase font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-primary shadow-2xs"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Invoice receipts and delivery confirmations will be delivered to this email.
              </p>
            </div>

            {/* Save Changes Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Delete My Account Text Link */}
          <div className="mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="text-xs font-semibold text-error hover:underline cursor-pointer"
            >
              Delete My Account
            </button>
          </div>
        </div>

        {/* Change Phone Modal / Info */}
        {showPhoneModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-border space-y-4">
              <h3 className="font-bold text-base text-text">Change Mobile Number</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                To update your verified phone number, please log out and sign in using your new mobile number via the Phone OTP flow.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:opacity-90 cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
