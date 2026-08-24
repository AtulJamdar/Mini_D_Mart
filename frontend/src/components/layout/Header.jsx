import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router';
import {
  ShoppingCart,
  MapPin,
  Search,
  Bell,
  ChevronDown,
  Clock,
  ShoppingBag,
  Menu,
  X,
  User,
  Heart,
  Package,
  ShieldCheck,
  Briefcase,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { useSavedList } from '../../context/SavedListContext';
import AccountMenu from '../account/AccountMenu';

const ROTATING_PLACEHOLDERS = [
  'Search "Farm Fresh Whole Milk"...',
  'Search "Premium Basmati Rice"...',
  'Search "Organic Bananas"...',
  'Search "Fortune Sunlite Oil"...',
  'Search "Aashirvaad Shudh Chakki Atta"...',
  'Search "Amul Salted Butter"...',
  'Search "Surf Excel Matic Liquid"...',
  'Search "Tata Tea Gold"...',
];

export const CATEGORIES_NAV = [
  { id: 'dairy-bread-eggs', name: 'Dairy & Breakfast', icon: '🥛', query: 'Daily Essentials' },
  { id: 'fruits-vegetables', name: 'Fruits & Veggies', icon: '🥦', query: 'Fresh Fruits & Veggies' },
  { id: 'atta-rice-dal', name: 'Atta, Rice & Dals', icon: '🍚', query: 'Daily Essentials' },
  { id: 'snacks-biscuits', name: 'Snacks & Biscuits', icon: '🍪', query: 'Snacks & Beverages' },
  { id: 'drinks-juices', name: 'Drinks & Juices', icon: '🧃', query: 'Snacks & Beverages' },
  { id: 'personal-care', name: 'Personal Care', icon: '🧴', query: 'Household & Cleaning' },
  { id: 'cleaning-household', name: 'Cleaning & Household', icon: '🧼', query: 'Household & Cleaning' },
  { id: 'baby-wellness', name: 'Baby Care & Wellness', icon: '👶', query: 'Daily Essentials' },
];

export default function Header({ onOpenCartDrawer }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const { savedCount } = useSavedList();
  const { selectedLocation, openLocationModal } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isPlaceholderFading, setIsPlaceholderFading] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState([
    { id: 1, title: 'Welcome to Mini D-Mart!', desc: 'Use code MINIDMART50 for ₹50 off your first order.', time: 'Just now', unread: true },
    { id: 2, title: 'Express Delivery Active', desc: 'Guaranteed 2-hour delivery slot available in your zone.', time: '10m ago', unread: true },
  ]);

  // Sync search input with searchParams
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
  }, [navigate]);

  // Placeholder rotation interval
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaceholderFading(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
        setIsPlaceholderFading(false);
      }, 200);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/shop');
    }
    setIsMobileSearchOpen(false);
  };

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

  const markAllNotificationsRead = () => {
    setUnreadNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border shadow-xs">
      {/* Main Header Bar (Denser vertical padding & tighter gaps) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          {/* Left: Mobile Hamburger + Logo + Location Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Hamburger Button (Mobile / Tablet below md) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-gray-600 hover:text-primary hover:bg-bg transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-base sm:text-lg text-primary tracking-tight">
                  Mini <span className="text-text">D-Mart</span>
                </span>
                <span className="hidden sm:block text-[8px] font-bold text-accent uppercase tracking-wider">
                  Super Savings
                </span>
              </div>
            </Link>

            {/* Desktop Delivery Location & Slot Badge (Compact & Information-Dense) */}
            <button
              type="button"
              onClick={openLocationModal}
              aria-label="Choose delivery location"
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-bg hover:bg-primary/10 border border-border hover:border-primary/40 transition-all text-left cursor-pointer group shrink-0"
            >
              <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="max-w-36 xl:max-w-44 truncate">
                <div className="text-[11px] font-bold text-text flex items-center gap-1">
                  <span className="truncate">{selectedLocation?.label || 'Select Location'}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-[9px] text-gray-500 truncate flex items-center gap-1">
                  <Clock className="w-2 h-2 text-primary" />
                  <span className="truncate">{selectedLocation?.slotText || 'Choose Slot'}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Center: Search Bar (Denser & Full-Width) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-1 sm:mx-2">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={ROTATING_PLACEHOLDERS[placeholderIndex]}
                className={`w-full pl-9 pr-9 py-1.5 sm:py-2 rounded-lg border border-border bg-bg text-text text-xs sm:text-sm focus:outline-none focus:border-primary focus:bg-white transition-all shadow-2xs ${
                  isPlaceholderFading ? 'placeholder:opacity-0' : 'placeholder:opacity-100 placeholder:transition-opacity placeholder:duration-200'
                }`}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-primary text-white rounded text-[10px] font-bold hover:opacity-90 cursor-pointer hidden sm:block"
                >
                  SEARCH
                </button>
              )}
            </form>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-1.5 rounded-lg text-gray-600 hover:text-primary hover:bg-bg transition-colors cursor-pointer"
              aria-label="Toggle search bar"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Staff / Manager / Admin Quick Links (Desktop xl+) */}
            {isAuthenticated && (
              <div className="hidden xl:flex items-center gap-1">
                {['store_staff', 'store_manager', 'admin'].includes(user?.role) && (
                  <NavLink
                    to="/staff"
                    className={({ isActive }) =>
                      `px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        isActive ? 'bg-primary text-white' : 'text-gray-500 hover:bg-bg hover:text-text'
                      }`
                    }
                  >
                    Staff
                  </NavLink>
                )}
                {['store_manager', 'admin'].includes(user?.role) && (
                  <NavLink
                    to="/manager"
                    className={({ isActive }) =>
                      `px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        isActive ? 'bg-primary text-white' : 'text-gray-500 hover:bg-bg hover:text-text'
                      }`
                    }
                  >
                    Manager
                  </NavLink>
                )}
                {user?.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        isActive ? 'bg-primary text-white' : 'text-gray-500 hover:bg-bg hover:text-text'
                      }`
                    }
                  >
                    Admin
                  </NavLink>
                )}
              </div>
            )}

            {/* Notification Bell Icon & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-bg relative transition-colors cursor-pointer"
                aria-label="View notifications"
                aria-expanded={isNotificationOpen}
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {unreadNotifications.some((n) => n.unread) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-border shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                    <div className="font-bold text-xs text-text flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-primary" />
                      <span>Notifications</span>
                    </div>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="space-y-2">
                    {unreadNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl text-xs transition-colors ${
                          n.unread ? 'bg-primary/5 border border-primary/20' : 'bg-bg/60 border border-transparent'
                        }`}
                      >
                        <div className="font-semibold text-text flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[9px] text-gray-400 font-normal">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Account Area */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-1.5">
                {user?.role && user.role !== 'customer' && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase hidden md:inline-block ${getRoleBadge(user?.role)}`}>
                    {user?.role?.replace(/_/g, ' ')}
                  </span>
                )}
                <AccountMenu />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 sm:gap-1.5">
                <Link
                  to="/login"
                  className="px-2.5 py-1 text-xs font-semibold text-text hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1 text-xs font-semibold bg-primary text-white rounded-lg hover:opacity-90 transition-opacity shadow-2xs"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Cart Button */}
            <button
              type="button"
              onClick={onOpenCartDrawer}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary text-white hover:opacity-95 active:scale-95 transition-all shadow-2xs cursor-pointer"
              aria-label="Open cart drawer"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4" />
                {cart?.itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.2 bg-accent text-white text-[9px] font-extrabold rounded-full ring-2 ring-primary">
                    {cart.itemCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">
                Cart {cart?.total > 0 && `(₹${Math.round(cart.total)})`}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Row (Expandable below md) */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-2.5 pt-1 border-t border-border/60 animate-in slide-in-from-top-1 duration-150">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={ROTATING_PLACEHOLDERS[placeholderIndex]}
                className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-border bg-bg text-text text-xs focus:outline-none focus:border-primary focus:bg-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        )}

        {/* Mobile Location Pill Bar */}
        <div className="lg:hidden pb-1.5 pt-1 border-t border-border/60 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={openLocationModal}
            className="flex items-center gap-1 font-semibold text-text hover:text-primary transition-colors cursor-pointer truncate max-w-[65%]"
          >
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate">{selectedLocation?.label || 'Select Delivery Location'}</span>
            <ChevronDown className="w-2.5 h-2.5 text-gray-400 shrink-0" />
          </button>
          <span className="text-[9px] text-gray-500 flex items-center gap-1 font-medium shrink-0">
            <Clock className="w-2 h-2 text-primary" />
            <span>{selectedLocation?.slotText || '2-Hour Delivery'}</span>
          </span>
        </div>
      </div>

      {/* Horizontal Category Navigation Bar */}
      <nav aria-label="Product categories" className="bg-bg border-t border-border overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-1.5 flex items-center gap-1.5 sm:gap-2 min-w-max">
          <NavLink
            to="/shop"
            end
            className={({ isActive }) =>
              `px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                isActive ? 'bg-primary text-white shadow-2xs' : 'bg-white text-text hover:border-primary/40 border border-border'
              }`
            }
          >
            <span>🛍️</span>
            <span>All Products</span>
          </NavLink>

          {CATEGORIES_NAV.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${encodeURIComponent(cat.query)}`}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-text bg-white hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border transition-all flex items-center gap-1 shadow-2xs whitespace-nowrap"
            >
              <span className="text-xs">{cat.icon}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div className="p-3.5 border-b border-border flex items-center justify-between bg-bg/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div className="font-extrabold text-sm text-primary">Mini D-Mart</div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* User Greeting */}
              {isAuthenticated ? (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                  <div className="font-bold text-text text-sm flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>{user?.name || 'Customer'}</span>
                  </div>
                  <div className="text-gray-500">{user?.phone || user?.email}</div>
                  {user?.role && user.role !== 'customer' && (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getRoleBadge(user?.role)}`}>
                      {user?.role?.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2 px-3 text-center rounded-lg border border-primary text-primary font-bold hover:bg-primary/5"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2 px-3 text-center rounded-lg bg-primary text-white font-bold hover:opacity-90"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Delivery Zone Selector */}
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Delivery Zone
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openLocationModal();
                  }}
                  className="w-full p-2.5 rounded-lg bg-bg border border-border flex items-center justify-between text-left font-semibold"
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{selectedLocation?.label || 'Choose Location'}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>
              </div>

              {/* Role Dashboards */}
              {isAuthenticated && ['store_staff', 'store_manager', 'admin'].includes(user?.role) && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Management
                  </div>
                  {['store_staff', 'store_manager', 'admin'].includes(user?.role) && (
                    <Link
                      to="/staff"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 p-1.5 rounded-lg text-gray-700 hover:bg-bg font-medium"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-info" />
                      <span>Staff Counter</span>
                    </Link>
                  )}
                  {['store_manager', 'admin'].includes(user?.role) && (
                    <Link
                      to="/manager"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 p-1.5 rounded-lg text-gray-700 hover:bg-bg font-medium"
                    >
                      <Store className="w-3.5 h-3.5 text-accent" />
                      <span>Store Manager</span>
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 p-1.5 rounded-lg text-gray-700 hover:bg-bg font-medium"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-error" />
                      <span>Admin Control</span>
                    </Link>
                  )}
                </div>
              )}

              {/* Account Navigation */}
              {isAuthenticated && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Account
                  </div>
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-1.5 rounded-lg text-gray-700 hover:bg-bg font-medium"
                  >
                    <Package className="w-3.5 h-3.5 text-primary" />
                    <span>My Orders</span>
                  </Link>
                  <Link
                    to="/account/saved-list"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-1.5 rounded-lg text-gray-700 hover:bg-bg font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-accent" />
                      <span>Saved List</span>
                    </div>
                    {savedCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-accent/10 text-accent text-[10px] font-bold">
                        {savedCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <div className="p-3.5 border-t border-border bg-bg/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-error/30 text-error font-bold text-xs hover:bg-error/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
