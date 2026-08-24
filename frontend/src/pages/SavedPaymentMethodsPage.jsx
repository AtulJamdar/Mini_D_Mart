import React from 'react';
import AccountSidebar from '../components/account/AccountSidebar';
import EmptyState from '../components/molecules/EmptyState';

export default function SavedPaymentMethodsPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      <AccountSidebar />

      <main className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Saved Payment Methods</h1>
          <p className="text-sm text-gray-500">Manage your saved credit/debit cards and linked UPI handles.</p>
        </div>

        <EmptyState
          illustration="💳"
          heading="You have no saved payment methods"
          subtext="Saved cards and UPI accounts will appear here for fast 1-click checkout."
        />
      </main>
    </div>
  );
}
