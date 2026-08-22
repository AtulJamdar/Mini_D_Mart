import React from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router';
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
  const navLinkClasses = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-white'
        : 'text-gray-500 hover:text-text hover:bg-bg'
    }`;

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
          <NavLink to="/cart" className={navLinkClasses}>Cart</NavLink>
          <NavLink to="/orders" className={navLinkClasses}>Orders</NavLink>
          <NavLink to="/staff" className={navLinkClasses}>Staff</NavLink>
          <NavLink to="/manager" className={navLinkClasses}>Manager</NavLink>
          <NavLink to="/admin" className={navLinkClasses}>Admin</NavLink>
        </nav>

        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-bg text-text">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/manager" element={<ManagerPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-border py-4 text-center text-xs text-gray-500">
          Mini D-Mart MERN Monorepo Scaffolding &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </BrowserRouter>
  );
}
