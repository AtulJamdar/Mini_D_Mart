import Store from '../models/Store.js';
import PickupSlot from '../models/PickupSlot.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ReturnRequest from '../models/ReturnRequest.js';
import AuditLoggerService from '../services/auditLogger.service.js';
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
      name: name.trim(),
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state?.trim() || 'Maharashtra',
        pincode: address.pincode?.trim() || '400001',
      },
      geo: {
        type: 'Point',
        coordinates: geo?.coordinates?.length === 2
          ? [Number(geo.coordinates[0]), Number(geo.coordinates[1])]
          : [72.8777, 19.076],
      },
      isActive: true,
    });

    // Auto-create standard pickup slots for the new store
    try {
      const today = new Date();
      const standardSlotWindows = [
        { startHour: 9, endHour: 11, maxOrders: 8 },
        { startHour: 11, endHour: 13, maxOrders: 10 },
        { startHour: 14, endHour: 16, maxOrders: 10 },
        { startHour: 16, endHour: 18, maxOrders: 10 },
        { startHour: 18, endHour: 20, maxOrders: 8 },
      ];

      const slotsToInsert = standardSlotWindows.map((w) => {
        const startTime = new Date(today);
        startTime.setHours(w.startHour, 0, 0, 0);
        const endTime = new Date(today);
        endTime.setHours(w.endHour, 0, 0, 0);

        return {
          storeId: store._id,
          startTime,
          endTime,
          maxOrders: w.maxOrders,
          bookedCount: 0,
        };
      });

      await PickupSlot.insertMany(slotsToInsert);
    } catch (slotErr) {
      console.warn('[CreateStore] Warning: Could not auto-generate pickup slots:', slotErr.message);
    }

    await AuditLoggerService.logEvent({
      userId: req.user?._id,
      action: 'ADMIN_CREATE_STORE',
      resource: 'STORE',
      resourceId: store._id,
      metadata: { name: store.name, address: store.address },
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
    if (address) {
      updates.address = {
        street: address.street?.trim(),
        city: address.city?.trim(),
        state: address.state?.trim() || 'Maharashtra',
        pincode: address.pincode?.trim() || '400001',
      };
    }
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (geo?.coordinates?.length === 2) {
      updates.geo = {
        type: 'Point',
        coordinates: [Number(geo.coordinates[0]), Number(geo.coordinates[1])],
      };
    }

    const store = await Store.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!store) {
      return sendError(res, { statusCode: 404, message: 'Store not found' });
    }

    await AuditLoggerService.logEvent({
      userId: req.user?._id,
      action: 'ADMIN_UPDATE_STORE',
      resource: 'STORE',
      resourceId: store._id,
      metadata: { updates, name: store.name },
    });

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

    // Strict server-side check: staff/manager can only view analytics for their assigned store
    if (['store_staff', 'store_manager'].includes(req.user?.role) && req.user.assignedStoreId) {
      if (storeId !== req.user.assignedStoreId.toString()) {
        return sendError(res, {
          statusCode: 403,
          message: 'Access denied. You can only view analytics for your assigned store.',
        });
      }
    }

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
