import React, { useContext } from 'react';
import { Plus, Minus, Trash2, Package } from 'lucide-react';
import CartContext from '../../context/CartContext';

/**
 * Reusable CartItemRow component used by both CartPage and CartDrawer.
 *
 * @param {Object} item - Cart item object
 * @param {boolean} [compact=false] - If true, formats for slide-over drawers with compact spacing
 * @param {Function} [onUpdateQty] - Optional custom update quantity callback
 * @param {Function} [onRemoveItem] - Optional custom remove item callback
 * @param {boolean} [disabled] - Optional action loading/disabled flag
 */
export default function CartItemRow({
  item,
  compact = false,
  onUpdateQty,
  onRemoveItem,
  disabled,
}) {
  const cartContext = useContext(CartContext);
  const updateQty = onUpdateQty || cartContext?.updateQty;
  const removeItem = onRemoveItem || cartContext?.removeItem;
  const actionLoading = disabled !== undefined ? disabled : (cartContext?.actionLoading || false);

  const productId = item.productId?._id || item.productId || item._id;
  const maxStock = item.availableStock || item.stock || 99;
  const isMaxStock = item.qty >= maxStock;
  const isMinStock = item.qty <= 1;

  if (compact) {
    return (
      <div
        data-testid={`cart-item-${productId}`}
        className="bg-bg/40 rounded-xl border border-border p-3 flex gap-3 items-center hover:border-primary/30 transition-colors"
      >
        {/* Item Thumbnail */}
        <div className="w-16 h-16 rounded-lg bg-white border border-border/50 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400">
          {item.images && item.images[0] ? (
            <img
              src={item.images[0]}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-6 h-6 text-gray-300" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-text text-xs truncate" title={item.name}>
            {item.name}
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5">{item.unit}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-primary">
              ₹{(item.price * item.qty).toFixed(2)}
            </span>
            {maxStock <= 5 && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-accent/10 text-accent font-semibold">
                Only {maxStock} left
              </span>
            )}
          </div>
        </div>

        {/* Stepper & Remove */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center border border-border rounded-lg bg-white overflow-hidden">
            <button
              type="button"
              disabled={actionLoading || isMinStock}
              onClick={() => updateQty && updateQty(productId, item.qty - 1)}
              className="p-1 text-gray-500 hover:text-text hover:bg-bg disabled:opacity-40 cursor-pointer"
              title="Decrease quantity"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 py-0.5 text-xs font-bold text-text min-w-[20px] text-center">
              {item.qty}
            </span>
            <button
              type="button"
              disabled={actionLoading || isMaxStock}
              onClick={() => updateQty && updateQty(productId, item.qty + 1)}
              className="p-1 text-gray-500 hover:text-text hover:bg-bg disabled:opacity-40 cursor-pointer"
              title={isMaxStock ? 'Max stock reached' : 'Increase quantity'}
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            disabled={actionLoading}
            onClick={() => removeItem && removeItem(productId)}
            className="p-1 text-gray-400 hover:text-error transition-colors cursor-pointer rounded"
            title="Remove item"
            aria-label="Remove item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Full page view
  return (
    <div
      data-testid={`cart-item-${productId}`}
      className="bg-white rounded-2xl border border-border p-4 shadow-xs flex gap-4 items-center hover:border-primary/40 transition-colors"
    >
      {/* Product Image */}
      <div className="w-20 h-20 rounded-xl bg-bg border border-border/50 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400">
        {item.images && item.images[0] ? (
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-8 h-8 text-gray-300" />
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-text text-sm truncate" title={item.name}>
          {item.name}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Unit: {item.unit}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-primary">₹{item.price.toFixed(2)}</span>
          {maxStock <= 5 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-semibold">
              Only {maxStock} left
            </span>
          )}
        </div>
      </div>

      {/* Quantity Stepper & Remove */}
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-border rounded-lg bg-bg overflow-hidden">
          <button
            type="button"
            disabled={actionLoading || isMinStock}
            onClick={() => updateQty && updateQty(productId, item.qty - 1)}
            className="p-1.5 text-gray-500 hover:text-text hover:bg-white transition-colors disabled:opacity-40 cursor-pointer"
            title="Decrease quantity"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-3 py-1 text-xs font-bold text-text min-w-[28px] text-center">
            {item.qty}
          </span>
          <button
            type="button"
            disabled={actionLoading || isMaxStock}
            onClick={() => updateQty && updateQty(productId, item.qty + 1)}
            className="p-1.5 text-gray-500 hover:text-text hover:bg-white transition-colors disabled:opacity-40 cursor-pointer"
            title={isMaxStock ? 'Max stock reached' : 'Increase quantity'}
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          disabled={actionLoading}
          onClick={() => removeItem && removeItem(productId)}
          className="p-1.5 text-gray-500 hover:text-error rounded-lg hover:bg-error/10 transition-colors cursor-pointer"
          title="Remove item"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
