import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import PhoneAuthFlow from '../components/PhoneAuthFlow';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState('phone'); // 'phone' | 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  // If already logged in, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate(redirectPath, { replace: true });
    } else {
      setFormError(result.error || 'Failed to sign in.');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-border">
        {/* Toggle Mode Tabs */}
        <div className="flex bg-bg p-1 rounded-xl mb-6 border border-border">
          <button
            type="button"
            onClick={() => setAuthMode('phone')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authMode === 'phone'
                ? 'bg-white text-primary shadow-xs'
                : 'text-gray-500 hover:text-text'
            }`}
          >
            Customer (Mobile OTP)
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('email')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authMode === 'email'
                ? 'bg-white text-primary shadow-xs'
                : 'text-gray-500 hover:text-text'
            }`}
          >
            Staff / Admin (Email)
          </button>
        </div>

        {authMode === 'phone' ? (
          <PhoneAuthFlow
            onSuccess={() => {
              navigate(redirectPath, { replace: true });
            }}
          />
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary text-2xl">
                🔐
              </div>
              <h2 className="text-2xl font-bold text-text">Staff & Admin Sign In</h2>
              <p className="text-sm text-gray-500 mt-1">Access your store dashboard & management tools</p>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@minidmart.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:border-primary bg-bg text-text text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:border-primary bg-bg text-text text-sm transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 text-sm shadow-xs flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Signing In...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
