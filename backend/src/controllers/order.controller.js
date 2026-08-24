import OrderService from '../services/orderService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Checkout user's cart
 * POST /api/orders/checkout
 */
export const checkout = async (req, res) => {
  try {
    const { fulfillmentType, storeId, pickupSlotId, address } = req.body;

    const order = await OrderService.checkout(req.user._id, {
      fulfillmentType,
      storeId,
      pickupSlotId,
      address,
    });

    return sendSuccess(res, {
      statusCode: 201,
      data: order,
      message: 'Order placed successfully!',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Checkout failed',
    });
  }
};

/**
 * Get paginated orders (own orders for customer, or all/store orders for staff)
 * GET /api/orders
 */
export const getOrders = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    let targetStoreId = req.query.storeId || null;

    // Strict server-side store scoping: Staff & Managers are restricted to their assigned store
    if (['store_staff', 'store_manager'].includes(req.user.role)) {
      if (req.user.assignedStoreId) {
        targetStoreId = req.user.assignedStoreId;
      }
    }

    const isCustomer = req.user.role === 'customer';
    const result = await OrderService.getOrdersPaginated({
      userId: isCustomer ? req.user._id : req.query.userId || null,
      role: req.user.role,
      storeId: targetStoreId,
      page,
      limit,
      status,
    });

    return sendSuccess(res, {
      statusCode: 200,
      data: result,
      message: 'Orders retrieved successfully',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to retrieve orders',
      error: error.message,
    });
  }
};

/**
 * Get single order details with history
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res) => {
  try {
    const isCustomer = req.user.role === 'customer';
    const order = await OrderService.getOrderById(
      req.params.id,
      isCustomer ? req.user._id : null,
      req.user.role
    );

    if (!order) {
      return sendError(res, {
        statusCode: 404,
        message: 'Order not found',
      });
    }

    // Strict server-side check: staff/manager cannot view orders belonging to another store
    if (['store_staff', 'store_manager'].includes(req.user.role) && req.user.assignedStoreId) {
      const orderStoreId = order.storeId?._id?.toString() || order.storeId?.toString();
      if (orderStoreId && orderStoreId !== req.user.assignedStoreId.toString()) {
        return sendError(res, {
          statusCode: 403,
          message: 'Access denied. You do not have permission to view orders from another store.',
        });
      }
    }

    return sendSuccess(res, {
      statusCode: 200,
      data: order,
      message: 'Order details retrieved successfully',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 404,
      message: error.message || 'Order not found',
    });
  }
};

/**
 * Customer cancel order (only when status is PLACED or CONFIRMED)
 * PATCH /api/orders/:id/cancel
 */
export const cancelOrder = async (req, res) => {
  try {
    const { note } = req.body;
    const order = await OrderService.cancelOrder(
      req.params.id,
      req.user._id,
      note || 'Cancelled by customer'
    );

    return sendSuccess(res, {
      statusCode: 200,
      data: order,
      message: 'Order cancelled successfully. Inventory restored.',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to cancel order',
    });
  }
};

/**
 * Staff/Manager status transition (enforces State Machine)
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!status) {
      return sendError(res, {
        statusCode: 400,
        message: 'Target status is required in request body.',
      });
    }

    // Strict server-side check: staff/manager cannot modify orders for another store
    if (['store_staff', 'store_manager'].includes(req.user.role) && req.user.assignedStoreId) {
      const targetOrder = await OrderService.getOrderById(req.params.id);
      const orderStoreId = targetOrder?.storeId?._id?.toString() || targetOrder?.storeId?.toString();
      if (orderStoreId && orderStoreId !== req.user.assignedStoreId.toString()) {
        return sendError(res, {
          statusCode: 403,
          message: 'Access denied. You cannot modify orders for another store.',
        });
      }
    }

    const order = await OrderService.transitionOrderStatus(req.params.id, status, {
      actorId: req.user._id,
      actorRole: req.user.role,
      note: note || '',
    });

    return sendSuccess(res, {
      statusCode: 200,
      data: order,
      message: `Order status successfully transitioned to "${status.toUpperCase()}".`,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to transition order status',
    });
  }
};
