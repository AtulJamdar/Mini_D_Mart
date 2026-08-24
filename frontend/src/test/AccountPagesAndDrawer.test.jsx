import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import MyProfilePage from '../pages/MyProfilePage';
import MyAddressPage from '../pages/MyAddressPage';
import AccountMenu from '../components/account/AccountMenu';
import CartDrawer from '../components/cart/CartDrawer';
import { CartProvider } from '../context/CartContext';

// Mock auth context
const mockUser = {
  _id: 'user_123',
  name: 'Rahul Sharma',
  email: 'rahul@example.com',
  phone: '9876543210',
  role: 'customer',
  addresses: [
    {
      _id: 'addr_1',
      label: 'Home',
      addressLine1: 'Flat 402, Sai Residency',
      addressLine2: 'MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '9876543210',
      isDefault: true,
    },
  ],
};

const mockUpdateProfile = vi.fn().mockResolvedValue({ success: true });
const mockDeleteAccount = vi.fn().mockResolvedValue({ success: true });
const mockLogout = vi.fn().mockResolvedValue(true);
const mockRefreshUser = vi.fn().mockResolvedValue(mockUser);

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    updateProfile: mockUpdateProfile,
    deleteAccount: mockDeleteAccount,
    logout: mockLogout,
    refreshUser: mockRefreshUser,
  }),
}));

describe('Account Area & Cart Drawer Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('MyProfilePage renders read-only phone, name fields, save button, and delete account link', async () => {
    render(
      <MemoryRouter>
        <MyProfilePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'My Profile' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument();
    expect(screen.getByText('Change Mobile Number')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rahul')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sharma')).toBeInTheDocument();
    expect(screen.getByDisplayValue('rahul@example.com')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).toBeInTheDocument();

    const deleteLink = screen.getByText(/delete my account/i);
    expect(deleteLink).toBeInTheDocument();

    // Trigger save
    fireEvent.change(screen.getByDisplayValue('Rahul'), { target: { value: 'Rohan' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        firstName: 'Rohan',
        lastName: 'Sharma',
        email: 'rahul@example.com',
      });
    });
  });

  test('MyAddressPage renders saved address and opens form on + Add Address click', async () => {
    render(
      <MemoryRouter>
        <MyAddressPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'My Addresses' })).toBeInTheDocument();
    expect(screen.getByText('Flat 402, Sai Residency')).toBeInTheDocument();
    expect(screen.getByText(/Mumbai, Maharashtra/i)).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /\+ Add Address/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: 'Add New Delivery Address' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Flat 402, Sai Residency/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save address/i })).toBeInTheDocument();
  });

  test('AccountMenu renders greeting and shows dropdown menu with all account items and logout', () => {
    render(
      <MemoryRouter>
        <AccountMenu />
      </MemoryRouter>
    );

    expect(screen.getByText('Hello, Rahul')).toBeInTheDocument();
    expect(screen.getByText('My Account')).toBeInTheDocument();

    // Click menu button
    const menuBtn = screen.getByRole('button');
    fireEvent.click(menuBtn);

    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('My Address')).toBeInTheDocument();
    expect(screen.getByText('Saved Payment Method(s)')).toBeInTheDocument();
    expect(screen.getByText('Ready List')).toBeInTheDocument();
    expect(screen.getByText('My Orders')).toBeInTheDocument();
    expect(screen.getByText('My Saved List')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  test('CartDrawer renders over dimmed overlay and displays EmptyState when cart is empty', async () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <CartProvider>
          <CartDrawer isOpen={true} onClose={handleClose} />
        </CartProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('My Basket')).toBeInTheDocument();
    expect(await screen.findByText('No items in your cart')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start shopping/i })).toBeInTheDocument();

    const closeBtn = screen.getByTitle('Close cart');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
