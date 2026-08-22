import CartService from '../services/cartService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Get current user's cart
 * GET /api/cart
 */
export const getCart = async (req, res) => {
  try {
    const cart = await CartService.getCart(req.user._id);
    return sendSuccess(res, {
      statusCode: 200,
      data: cart,
      message: 'Cart retrieved successfully',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to retrieve cart',
      error: error.message,
    });
  }
};

/**
 * Add an item to cart
 * POST /api/cart/items
 */
export const addItem = async (req, res) => {
  try {
    const { productId, qty } = req.body;
    if (!productId) {
      return sendError(res, {
        statusCode: 400,
        message: 'Product ID is required',
      });
    }

    const updatedCart = await CartService.addItem(req.user._id, {
      productId,
      qty: qty || 1,
    });

    return sendSuccess(res, {
      statusCode: 200,
      data: updatedCart,
      message: 'Item added to cart',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to add item to cart',
    });
  }
};

/**
 * Update item quantity in cart
 * PUT /api/cart/items/:productId
 */
export const updateItemQty = async (req, res) => {
  try {
    const { productId } = req.params;
    const { qty } = req.body;

    if (qty === undefined || qty === null) {
      return sendError(res, {
        statusCode: 400,
        message: 'Quantity is required',
      });
    }

    const updatedCart = await CartService.updateItemQty(req.user._id, {
      productId,
      qty: Number(qty),
    });

    return sendSuccess(res, {
      statusCode: 200,
      data: updatedCart,
      message: 'Cart item quantity updated',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to update item quantity',
    });
  }
};

/**
 * Remove an item from cart
 * DELETE /api/cart/items/:productId
 */
export const removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const updatedCart = await CartService.removeItem(req.user._id, productId);

    return sendSuccess(res, {
      statusCode: 200,
      data: updatedCart,
      message: 'Item removed from cart',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to remove item from cart',
      error: error.message,
    });
  }
};

/**
 * Clear all items from cart
 * DELETE /api/cart
 */
export const clearCart = async (req, res) => {
  try {
    const emptyCart = await CartService.clearCart(req.user._id);

    return sendSuccess(res, {
      statusCode: 200,
      data: emptyCart,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to clear cart',
      error: error.message,
    });
  }
};
