import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import OrderQueueList from '../components/OrderQueueList';
import ReturnQueueList from '../components/ReturnQueueList';
import EmptyState from '../components/molecules/EmptyState';
import AddCard from '../components/molecules/AddCard';
import MySavedListPage from '../pages/MySavedListPage';
import ReadyListPage from '../pages/ReadyListPage';
import SavedPaymentMethodsPage from '../pages/SavedPaymentMethodsPage';

// Mock AuthContext for AccountSidebar inside page tests
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'John Doe', email: 'john@example.com', role: 'customer' },
    isAuthenticated: true,
  }),
}));

describe('Empty & Error States Component Tests', () => {
  test('EmptyState renders illustration, heading, subtext, and triggers CTA click', () => {
    const handleCta = vi.fn();
    render(
      <EmptyState
        illustration="🛒"
        heading="No items in your cart"
        subtext="Browse from our wide variety of products & exciting offers"
        ctaLabel="START SHOPPING"
        onCtaClick={handleCta}
      />
    );

    expect(screen.getByText('🛒')).toBeInTheDocument();
    expect(screen.getByText('No items in your cart')).toBeInTheDocument();
    expect(
      screen.getByText('Browse from our wide variety of products & exciting offers')
    ).toBeInTheDocument();

    const ctaButton = screen.getByRole('button', { name: /start shopping/i });
    expect(ctaButton).toBeInTheDocument();
    fireEvent.click(ctaButton);
    expect(handleCta).toHaveBeenCalledTimes(1);
  });

  test('EmptyState renders custom SVG illustration and works without CTA', () => {
    render(
      <EmptyState
        illustration={<span data-testid="custom-svg">SVG_ICON</span>}
        heading="You have no saved payment methods"
        subtext="Saved cards will appear here"
      />
    );

    expect(screen.getByTestId('custom-svg')).toBeInTheDocument();
    expect(screen.getByText('You have no saved payment methods')).toBeInTheDocument();
    expect(screen.getByText('Saved cards will appear here')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('AddCard renders title, subtitle, and fires onClick callback', () => {
    const handleAdd = vi.fn();
    render(
      <AddCard
        title="+ ADD NEW ADDRESS"
        subtitle="Add a new home or office address"
        onClick={handleAdd}
      />
    );

    const btn = screen.getByRole('button', { name: /\+ ADD NEW ADDRESS/i });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText('Add a new home or office address')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleAdd).toHaveBeenCalledTimes(1);
  });

  test('OrderQueueList renders friendly empty state message when queue is empty', () => {
    render(<OrderQueueList orders={[]} />);

    expect(screen.getByText(/No active orders in this queue/i)).toBeInTheDocument();
  });

  test('ReturnQueueList renders friendly empty state message when returns list is empty', () => {
    render(<ReturnQueueList requests={[]} />);

    expect(screen.getByText(/No return or exchange requests in this queue/i)).toBeInTheDocument();
  });

  test('Error banner alert renders prominently when error message is supplied', () => {
    function ErrorBanner({ message }) {
      if (!message) return null;
      return (
        <div data-testid="error-alert" role="alert" className="text-error bg-error/10">
          {message}
        </div>
      );
    }

    render(<ErrorBanner message="Network connection failed. Please retry." />);

    const alert = screen.getByTestId('error-alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Network connection failed. Please retry.');
  });

  test('MySavedListPage renders empty saved list state with CTA', () => {
    render(
      <MemoryRouter>
        <MySavedListPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'My Saved List' })).toBeInTheDocument();
    expect(screen.getByText('There are no items in your List')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start shopping/i })).toBeInTheDocument();
  });

  test('ReadyListPage renders empty ready list state with CTA', () => {
    render(
      <MemoryRouter>
        <ReadyListPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Ready List' })).toBeInTheDocument();
    expect(screen.getByText('There are no items in your Ready List')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start shopping/i })).toBeInTheDocument();
  });

  test('SavedPaymentMethodsPage renders informational empty state without CTA action button', () => {
    render(
      <MemoryRouter>
        <SavedPaymentMethodsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Saved Payment Methods' })).toBeInTheDocument();
    expect(screen.getByText('You have no saved payment methods')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pay via razorpay/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start shopping/i })).not.toBeInTheDocument();
  });
});
