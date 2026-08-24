import React from 'react';
import { useNavigate } from 'react-router';
import AccountSidebar from '../components/account/AccountSidebar';
import EmptyState from '../components/molecules/EmptyState';

export default function ReadyListPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      <AccountSidebar />

      <main className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Ready List</h1>
          <p className="text-sm text-gray-500">Your frequently ordered items and quick-reorder basket.</p>
        </div>

        <EmptyState
          illustration="⚡"
          heading="There are no items in your Ready List"
          subtext="The list will be auto-populated according to the items you added to save for later."
          ctaLabel="START SHOPPING"
          onCtaClick={() => navigate('/shop')}
        />
      </main>
    </div>
  );
}
