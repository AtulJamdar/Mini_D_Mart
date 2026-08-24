import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import CartItemRow from '../components/cart/CartItemRow';

describe('Cart Quantity Stepper & CartItemRow Tests', () => {
  const sampleItem = {
    productId: 'prod_123',
    name: 'Tata Salt Vacuum Evaporated',
    unit: '1 kg',
    price: 28,
    availableStock: 5,
    qty: 2,
  };

  test('CartItemRow renders item details, price, and stepper in full page mode', () => {
    const handleUpdate = vi.fn();
    const handleRemove = vi.fn();

    render(
      <CartItemRow
        item={sampleItem}
        compact={false}
        onUpdateQty={handleUpdate}
        onRemoveItem={handleRemove}
      />
    );

    expect(screen.getByText('Tata Salt Vacuum Evaporated')).toBeInTheDocument();
    expect(screen.getByText('Unit: 1 kg')).toBeInTheDocument();
    expect(screen.getByText('₹28.00')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    // Increment
    fireEvent.click(screen.getByTitle('Increase quantity'));
    expect(handleUpdate).toHaveBeenCalledWith('prod_123', 3);

    // Decrement
    fireEvent.click(screen.getByTitle('Decrease quantity'));
    expect(handleUpdate).toHaveBeenCalledWith('prod_123', 1);

    // Remove
    fireEvent.click(screen.getByTitle('Remove item'));
    expect(handleRemove).toHaveBeenCalledWith('prod_123');
  });

  test('CartItemRow disables decrement button when qty is 1', () => {
    const handleUpdate = vi.fn();
    render(
      <CartItemRow
        item={{ ...sampleItem, qty: 1 }}
        compact={true}
        onUpdateQty={handleUpdate}
      />
    );

    expect(screen.getByTitle('Decrease quantity')).toBeDisabled();
    expect(screen.getByTitle('Increase quantity')).not.toBeDisabled();
  });

  test('CartItemRow disables increment button when qty reaches availableStock', () => {
    const handleUpdate = vi.fn();
    render(
      <CartItemRow
        item={{ ...sampleItem, qty: 5, availableStock: 5 }}
        compact={true}
        onUpdateQty={handleUpdate}
      />
    );

    expect(screen.getByTitle('Max stock reached')).toBeDisabled();
    expect(screen.getByTitle('Decrease quantity')).not.toBeDisabled();
  });
});
