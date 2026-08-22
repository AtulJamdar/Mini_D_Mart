import Store from '../models/Store.js';
import PickupSlot from '../models/PickupSlot.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ReturnRequest from '../models/ReturnRequest.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Get all active stores
 * GET /api/stores
 */
export const getStores = async (req, res) => {
  try {
    const stores = await Store.find({ isActive: true });
    return sendSuccess(res, {
      statusCode: 200,
      data: stores,
      message: 'Stores retrieved successfully',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to retrieve stores',
      error: error.message,
    });
  }
};

/**
 * Get pickup slots for a specific store
 * GET /api/stores/:storeId/slots
 */
export const getStoreSlots = async (req, res) => {
  try {
    const { storeId } = req.params;
    const slots = await PickupSlot.find({ storeId }).sort({ startTime: 1 });

    const formattedSlots = slots.map((slot) => ({
      _id: slot._id,
      storeId: slot.storeId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxOrders: slot.maxOrders,
      bookedCount: slot.bookedCount,
      availableSlots: Math.max(0, slot.maxOrders - slot.bookedCount),
      isFull: slot.bookedCount >= slot.maxOrders,
    }));

    return sendSuccess(res, {
      statusCode: 200,
      data: formattedSlots,
      message: 'Store pickup slots retrieved',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to retrieve pickup slots',
      error: error.message,
    });
  }
};

/**
 * Get store KPI analytics (Revenue, Active Orders, Low Stock Alerts, Pending Returns)
 * GET /api/stores/:storeId/analytics
 */
export const getStoreAnalytics = async (req, res) => {
  try {
    const { storeId } = req.params;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayOrders, activeOrdersCount, lowStockProducts, pendingReturns] = await Promise.all([
      // 1. Today's orders
      Order.find({
        storeId,
        createdAt: { $gte: startOfToday },
        status: { $ne: 'cancelled' },
      }),
      // 2. Currently active in-flight orders
      Order.countDocuments({
        storeId,
        status: { $in: ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'] },
      }),
      // 3. Low stock items (stock <= 10)
      Product.find({
        storeId,
        stock: { $lte: 10 },
      }).select('name stock unit price categoryId'),
      // 4. Pending return requests for this store
      ReturnRequest.find({ status: 'requested' }).populate('orderId', 'storeId'),
    ]);

    const todaySales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const storePendingReturns = pendingReturns.filter(
      (r) => r.orderId && r.orderId.storeId?.toString() === storeId.toString()
    );

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        todaySales: Math.round(todaySales * 100) / 100,
        todayOrdersCount: todayOrders.length,
        activeOrdersCount,
        lowStockCount: lowStockProducts.length,
        lowStockItems: lowStockProducts,
        pendingReturnsCount: storePendingReturns.length,
      },
      message: 'Store analytics retrieved successfully',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to retrieve store analytics',
      error: error.message,
    });
  }
};
