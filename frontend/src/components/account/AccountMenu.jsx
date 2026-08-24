import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  User,
  MapPin,
  CreditCard,
  Zap,
  Package,
  Bookmark,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Extract first name
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  const menuItems = [
    { to: '/account/profile', label: 'My Profile', icon: User },
    { to: '/account/addresses', label: 'My Address', icon: MapPin },
    { to: '/account/payment-methods', label: 'Saved Payment Method(s)', icon: CreditCard },
    { to: '/account/ready-list', label: 'Ready List', icon: Zap },
    { to: '/orders', label: 'My Orders', icon: Package },
    { to: '/account/saved-list', label: 'My Saved List', icon: Bookmark },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div
      ref={menuRef}
      className="relative inline-block text-left"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Header Button: Hello {firstName} / My Account */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-bg transition-colors cursor-pointer text-left focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
          {firstName[0]?.toUpperCase() || 'U'}
        </div>
        <div className="hidden sm:block">
          <div className="text-[11px] text-gray-400 font-medium leading-none">Hello, {firstName}</div>
          <div className="text-xs font-bold text-text flex items-center gap-1 leading-tight mt-0.5">
            My Account
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full pt-1.5 w-60 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="bg-white rounded-2xl border border-border shadow-lg p-2 space-y-1">
            {/* Header info inside dropdown */}
            <div className="px-3 py-2 border-b border-border/70 mb-1">
              <div className="text-xs font-bold text-text truncate">{user?.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{user?.email || user?.phone}</div>
            </div>

            {/* Menu Items with light-green hover */}
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text hover:bg-primary/10 hover:text-primary transition-colors group"
                >
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Logout Option */}
            <div className="pt-1 border-t border-border/70 mt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error/10 transition-colors cursor-pointer text-left group"
              >
                <LogOut className="w-4 h-4 text-error shrink-0" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
