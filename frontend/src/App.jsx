import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import { SavedListProvider } from './context/SavedListContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import MyProfilePage from './pages/MyProfilePage';
import MyAddressPage from './pages/MyAddressPage';
import MySavedListPage from './pages/MySavedListPage';
import ReadyListPage from './pages/ReadyListPage';
import SavedPaymentMethodsPage from './pages/SavedPaymentMethodsPage';
import StaffPage from './pages/StaffPage';
import ManagerPage from './pages/ManagerPage';
import AdminPage from './pages/AdminPage';
import AdminStaffPage from './pages/AdminStaffPage';
import NotFoundPage from './pages/NotFoundPage';

import Header from './components/layout/Header';
import LocationModal from './components/location/LocationModal';
import CartDrawer from './components/cart/CartDrawer';

function MainApp() {
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-bg text-text">
        {/* Customer Header with Location, Rotating Search, Notifications, AccountMenu & Category Nav */}
        <Header onOpenCartDrawer={() => setIsCartDrawerOpen(true)} />

        {/* Location Picker Modal */}
        <LocationModal />

        {/* Slide-over Cart Drawer */}
        <CartDrawer
          isOpen={isCartDrawerOpen}
          onClose={() => setIsCartDrawerOpen(false)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Public / Shop Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/cart" element={<CartPage />} />

            {/* Authenticated Customer Routes */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
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
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Account Area Routes */}
            <Route
              path="/account/profile"
              element={
                <ProtectedRoute>
                  <MyProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/addresses"
              element={
                <ProtectedRoute>
                  <MyAddressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/saved-list"
              element={
                <ProtectedRoute>
                  <MySavedListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/ready-list"
              element={
                <ProtectedRoute>
                  <ReadyListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/payment-methods"
              element={
                <ProtectedRoute>
                  <SavedPaymentMethodsPage />
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
            <Route
              path="/admin/staff"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminStaffPage />
                </RoleRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-border py-6 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="font-semibold text-text">
              Mini D-Mart &copy; {new Date().getFullYear()} • Fresh Grocery at Everyday Low Prices
            </div>
            <div className="flex items-center gap-4 text-[11px] text-gray-400">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Fulfillment & Returns</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <LocationProvider>
          <SavedListProvider>
            <MainApp />
          </SavedListProvider>
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
  );
}
