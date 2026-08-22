import React from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import StaffPage from './pages/StaffPage';
import ManagerPage from './pages/ManagerPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();

  const navLinkClasses = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-white'
        : 'text-gray-500 hover:text-text hover:bg-bg'
    }`;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-error/10 text-error';
      case 'store_manager':
        return 'bg-accent/10 text-accent';
      case 'store_staff':
        return 'bg-info/10 text-info';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <span className="p-1.5 rounded-lg bg-primary/10 text-primary">🛒</span>
          Mini D-Mart
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/" end className={navLinkClasses}>Home</NavLink>
          <NavLink to="/shop" className={navLinkClasses}>Shop</NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/cart" className={navLinkClasses}>Cart</NavLink>
              <NavLink to="/orders" className={navLinkClasses}>Orders</NavLink>
            </>
          )}
          {isAuthenticated && ['store_staff', 'store_manager', 'admin'].includes(user?.role) && (
            <NavLink to="/staff" className={navLinkClasses}>Staff</NavLink>
          )}
          {isAuthenticated && ['store_manager', 'admin'].includes(user?.role) && (
            <NavLink to="/manager" className={navLinkClasses}>Manager</NavLink>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <NavLink to="/admin" className={navLinkClasses}>Admin</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-text">{user?.name}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getRoleBadge(user?.role)}`}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={logout}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-border text-gray-500 hover:text-error hover:border-error transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-text hover:text-primary transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-bg text-text">
          <Navigation />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Authenticated Customer Routes */}
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />

              {/* Role Restricted Routes */}
              <Route
                path="/staff"
                element={
                  <RoleRoute allowedRoles={['store_staff', 'store_manager', 'admin']}>
                    <StaffPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/manager"
                element={
                  <RoleRoute allowedRoles={['store_manager', 'admin']}>
                    <ManagerPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <RoleRoute allowedRoles={['admin']}>
                    <AdminPage />
                  </RoleRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-border py-4 text-center text-xs text-gray-500">
            Mini D-Mart MERN Monorepo &copy; {new Date().getFullYear()}
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
