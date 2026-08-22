import Store from '../models/Store.js';
import PickupSlot from '../models/PickupSlot.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ReturnRequest from '../models/ReturnRequest.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Get all active stores (or all stores if includeInactive is passed)
 * GET /api/stores
 */
export const getStores = async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const stores = await Store.find(filter).sort({ name: 1 });

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
 * Create a new Store branch (Admin)
 * POST /api/stores
 */
export const createStore = async (req, res) => {
  try {
    const { name, address, geo } = req.body;
    if (!name || !address?.street || !address?.city) {
      return sendError(res, {
        statusCode: 400,
        message: 'Store name, street, and city are required.',
      });
    }

    const store = await Store.create({
      name,
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state?.trim() || 'Maharashtra',
        pincode: address.pincode?.trim() || '400001',
      },
      geo: {
        type: 'Point',
        coordinates: geo?.coordinates || [72.8777, 19.076],
      },
      isActive: true,
    });

    return sendSuccess(res, {
      statusCode: 201,
      data: store,
      message: `Store "${store.name}" created successfully.`,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to create store',
    });
  }
};

/**
 * Update store branch details or active status (Admin)
 * PATCH /api/stores/:id
 */
export const updateStore = async (req, res) => {
  try {
    const { name, address, isActive, geo } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (address) updates.address = address;
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (geo) updates.geo = geo;

    const store = await Store.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!store) {
      return sendError(res, { statusCode: 404, message: 'Store not found' });
    }

    return sendSuccess(res, {
      statusCode: 200,
      data: store,
      message: 'Store updated successfully.',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to update store',
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
 * Get store KPI analytics
 * GET /api/stores/:storeId/analytics
 */
export const getStoreAnalytics = async (req, res) => {
  try {
    const { storeId } = req.params;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayOrders, activeOrdersCount, lowStockProducts, pendingReturns] = await Promise.all([
      Order.find({ storeId, createdAt: { $gte: startOfToday }, status: { $ne: 'cancelled' } }),
      Order.countDocuments({ storeId, status: { $in: ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'] } }),
      Product.find({ storeId, stock: { $lte: 10 } }).select('name stock unit price categoryId'),
      ReturnRequest.find({ status: 'requested' }).populate('orderId', 'storeId'),
    ]);

    const todaySales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const storePendingReturns = pendingReturns.filter((r) => r.orderId && r.orderId.storeId?.toString() === storeId.toString());

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
