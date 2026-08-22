import React from 'react';
import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto text-center bg-white p-8 rounded-2xl shadow-sm border border-border mt-8">
      <h1 className="text-5xl font-bold text-error mb-2">404</h1>
      <h2 className="text-xl font-semibold text-text mb-2">Page Not Found</h2>
      <p className="text-sm text-gray-500 mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-block px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
      >
        Return to Home
      </Link>
    </div>
  );
}
