import React from 'react';
import { Link } from 'react-router';

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-border">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text">Create an Account</h2>
        <p className="text-sm text-gray-500 mt-1">Join Mini D-Mart today</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary bg-bg text-text"
            disabled
          />
        </div>

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
          Create Account (Scaffold)
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
