import React from 'react';
import { NavLink } from 'react-router';
import {
  User,
  MapPin,
  CreditCard,
  Zap,
  Package,
  Bookmark,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccountSidebar() {
  const { user } = useAuth();

  const navItems = [
    { to: '/account/profile', label: 'My Profile', icon: User },
    { to: '/account/addresses', label: 'My Address', icon: MapPin },
    { to: '/account/payment-methods', label: 'Saved Payment Method(s)', icon: CreditCard },
    { to: '/account/ready-list', label: 'Ready List', icon: Zap },
    { to: '/orders', label: 'My Orders', icon: Package },
    { to: '/account/saved-list', label: 'My Saved List', icon: Bookmark },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4">
      {/* User Profile Badge Card */}
      <div className="bg-white rounded-2xl border border-border p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center border border-primary/20">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-text truncate">{user?.name || 'Customer'}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email || user?.phone || 'Customer Account'}</div>
          </div>
        </div>
      </div>

      {/* Account Navigation Links */}
      <nav className="bg-white rounded-2xl border border-border p-2 shadow-xs space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-600 hover:bg-bg hover:text-text'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
