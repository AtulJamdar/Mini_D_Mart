import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import AuthContext from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const renderWithAuth = (authValue, initialPath = '/orders') => {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <div data-testid="orders-page">Private Orders Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute Component Tests', () => {
  test('Redirects unauthenticated user to /login', () => {
    renderWithAuth({ isAuthenticated: false, loading: false, user: null });

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('orders-page')).not.toBeInTheDocument();
  });

  test('Renders protected child component for authenticated user', () => {
    renderWithAuth({
      isAuthenticated: true,
      loading: false,
      user: { name: 'John Doe', role: 'customer' },
    });

    expect(screen.getByTestId('orders-page')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
});
