import React from 'react';
import { Link } from 'react-router';

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-border">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text">Sign In to Mini D-Mart</h2>
        <p className="text-sm text-gray-500 mt-1">Access your account to continue</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary bg-bg text-text"
            disabled
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary bg-bg text-text"
            disabled
          />
        </div>

        <button
          type="button"
          className="w-full py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          Sign In (Scaffold)
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
