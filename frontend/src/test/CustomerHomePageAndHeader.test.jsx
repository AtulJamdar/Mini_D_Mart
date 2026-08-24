import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import Header, { CATEGORIES_NAV } from '../components/layout/Header';
import LocationModal from '../components/location/LocationModal';
import HeroBanner from '../components/home/HeroBanner';
import PopularCategories, { POPULAR_CATEGORIES_DATA } from '../components/home/PopularCategories';
import HomePage from '../pages/HomePage';
import { LocationProvider, DEFAULT_LOCATION } from '../context/LocationContext';
import { CartProvider } from '../context/CartContext';
import AuthContext from '../context/AuthContext';

// Mock auth context
const mockUser = {
  _id: 'u1',
  name: 'Ananya Roy',
  email: 'ananya@example.com',
  phone: '9876543210',
  role: 'customer',
  preferredLocation: {
    label: 'Bandra West',
    pincode: '400050',
    city: 'Mumbai',
  },
};

const renderWithProviders = (ui, { authUser = null, initialLocation = null } = {}) => {
  if (initialLocation) {
    localStorage.setItem('mini_dmart_location', JSON.stringify(initialLocation));
  } else {
    localStorage.removeItem('mini_dmart_location');
  }

  const authValue = {
    user: authUser,
    isAuthenticated: !!authUser,
    login: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    refreshUser: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <CartProvider>
        <LocationProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </LocationProvider>
      </CartProvider>
    </AuthContext.Provider>
  );
};

describe('Customer Home Page & Header Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('Header renders logo, delivery location button, search input, notification bell, cart trigger, and category navigation bar', () => {
    const handleOpenCart = vi.fn();
    renderWithProviders(<Header onOpenCartDrawer={handleOpenCart} />, {
      initialLocation: {
        label: 'Downtown Mumbai',
        pincode: '400001',
        city: 'Mumbai',
        slotText: 'Today, 4 PM - 6 PM',
      },
    });

    // 1. Logo
    expect(screen.getByText('Mini')).toBeInTheDocument();
    expect(screen.getByText('D-Mart')).toBeInTheDocument();

    // 2. Delivery location
    expect(screen.getByLabelText('Choose delivery location')).toBeInTheDocument();
    expect(screen.getAllByText('Downtown Mumbai')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Today, 4 PM - 6 PM')[0]).toBeInTheDocument();

    // 3. Search Bar
    const searchInput = screen.getByRole('textbox');
    expect(searchInput).toBeInTheDocument();

    // 4. Notification Bell
    const bellBtn = screen.getByLabelText('View notifications');
    expect(bellBtn).toBeInTheDocument();

    // Toggle notification dropdown
    fireEvent.click(bellBtn);
    expect(screen.getByText('Welcome to Mini D-Mart!')).toBeInTheDocument();

    // 5. Cart Button
    const cartBtn = screen.getByLabelText('Open cart drawer');
    expect(cartBtn).toBeInTheDocument();
    fireEvent.click(cartBtn);
    expect(handleOpenCart).toHaveBeenCalledTimes(1);

    // 6. Guest Auth Links
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();

    // 7. Category Navigation Bar (7-8 categories)
    expect(screen.getByText('All Products')).toBeInTheDocument();
    expect(screen.getByText('Dairy, Bread & Eggs')).toBeInTheDocument();
    expect(screen.getByText('Fruits & Vegetables')).toBeInTheDocument();
    expect(screen.getByText('Atta, Rice & Dals')).toBeInTheDocument();
    expect(screen.getByText('Snacks & Biscuits')).toBeInTheDocument();
  });

  test('Header mounts AccountMenu when user is authenticated', () => {
    renderWithProviders(<Header onOpenCartDrawer={vi.fn()} />, {
      authUser: mockUser,
      initialLocation: {
        label: 'Bandra West',
        pincode: '400050',
        city: 'Mumbai',
        slotText: 'Today, 5 PM - 7 PM',
      },
    });

    expect(screen.getByText('Hello, Ananya')).toBeInTheDocument();
    expect(screen.getByText('My Account')).toBeInTheDocument();
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });

  test('LocationModal auto-opens on first visit when no location is set in localStorage', async () => {
    localStorage.removeItem('mini_dmart_location');

    renderWithProviders(
      <>
        <Header onOpenCartDrawer={vi.fn()} />
        <LocationModal />
      </>
    );

    // Should automatically open
    expect(screen.getByRole('heading', { name: 'Choose delivery location' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search for area, street name or pincode..')).toBeInTheDocument();
    expect(screen.getByText('Use current location')).toBeInTheDocument();
    expect(screen.getByText('Popular Delivery Areas')).toBeInTheDocument();
  });

  test('LocationModal allows searching, picking an area, and persisting to localStorage', async () => {
    renderWithProviders(
      <>
        <Header onOpenCartDrawer={vi.fn()} />
        <LocationModal />
      </>,
      {
        initialLocation: {
          label: 'Downtown Mumbai',
          pincode: '400001',
          city: 'Mumbai',
          slotText: 'Today, 4 PM - 6 PM',
        },
      }
    );

    // Click header location to open modal
    const locationBtn = screen.getByLabelText('Choose delivery location');
    fireEvent.click(locationBtn);

    expect(screen.getByRole('heading', { name: 'Choose delivery location' })).toBeInTheDocument();

    // Select a popular area e.g. Bandra West
    const bandraBtn = screen.getByText('Bandra West');
    fireEvent.click(bandraBtn);

    // Modal should close and location in localStorage should update
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('mini_dmart_location'));
      expect(stored.pincode).toBe('400050');
      expect(stored.city).toBe('Mumbai');
    });
  });

  test('HeroBanner renders headline, subtext, SHOP NOW button, and promo badges with rounded styling', () => {
    render(
      <MemoryRouter>
        <HeroBanner />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /fresh groceries delivered at your doorstep/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/everyday low prices guaranteed/i)).toBeInTheDocument();

    const shopNowBtn = screen.getByRole('link', { name: /shop now/i });
    expect(shopNowBtn).toBeInTheDocument();
    expect(shopNowBtn.getAttribute('href')).toBe('/shop');
  });

  test('PopularCategories renders horizontal row of category cards and scroll affordance', () => {
    render(
      <MemoryRouter>
        <PopularCategories />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Popular Categories' })).toBeInTheDocument();
    expect(screen.getByText('Dairy & Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Fruits & Veggies')).toBeInTheDocument();
    expect(screen.getByText('Atta, Rice & Dal')).toBeInTheDocument();
    expect(screen.getByText('Snacks & Munchies')).toBeInTheDocument();

    // Scroll more categories affordance button
    const scrollRightBtn = screen.getByTitle('Scroll for more categories');
    expect(scrollRightBtn).toBeInTheDocument();
  });

  test('HomePage renders HeroBanner, PopularCategories, Value Perks, and Featured Super Saver Deals', () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole('heading', { name: /fresh groceries delivered at your doorstep/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Popular Categories' })).toBeInTheDocument();
    expect(screen.getByText('2-Hour Delivery')).toBeInTheDocument();
    expect(screen.getByText('100% Quality Guaranteed')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Featured Super Saver Deals' })).toBeInTheDocument();
  });
});
