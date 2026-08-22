import Store from '../models/Store.js';
import PickupSlot from '../models/PickupSlot.js';
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

    const formattedSlots = slots.map((slot) => {
      const isFull = slot.bookedCount >= slot.maxOrders;
      return {
        _id: slot._id,
        storeId: slot.storeId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxOrders: slot.maxOrders,
        bookedCount: slot.bookedCount,
        availableSlots: Math.max(0, slot.maxOrders - slot.bookedCount),
        isFull,
      };
    });

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
