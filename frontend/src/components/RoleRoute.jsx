import React from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-border text-center mt-6">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4 text-xl font-bold">
          ✕
        </div>
        <h2 className="text-xl font-bold text-text mb-2">Access Restricted</h2>
        <p className="text-sm text-gray-500 mb-6">
          Your role (<span className="font-semibold text-text">{user?.role}</span>) does not have permission to view this section.
        </p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return children;
}
