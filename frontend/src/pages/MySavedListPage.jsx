import React from 'react';
import { useNavigate } from 'react-router';
import AccountSidebar from '../components/account/AccountSidebar';
import EmptyState from '../components/molecules/EmptyState';
import ProductCard from '../components/ProductCard';
import { useSavedList } from '../context/SavedListContext';

export default function MySavedListPage() {
  const navigate = useNavigate();
  const { savedItems, clearSavedList } = useSavedList();

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      <AccountSidebar />

      <main className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">My Saved List</h1>
            <p className="text-sm text-gray-500">
              Items you have bookmarked to purchase at a later time ({savedItems.length}).
            </p>
          </div>
          {savedItems.length > 0 && (
            <button
              onClick={clearSavedList}
              className="text-xs font-semibold text-error hover:underline cursor-pointer"
            >
              Clear All Saved Items
            </button>
          )}
        </div>

        {savedItems.length === 0 ? (
          <EmptyState
            illustration="🔖"
            heading="There are no items in your List"
            subtext="The list will be auto-populated according to the items you added to save for later."
            ctaLabel="START SHOPPING"
            onCtaClick={() => navigate('/shop')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedItems.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
