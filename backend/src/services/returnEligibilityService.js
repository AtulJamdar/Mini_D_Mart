import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ReturnRequest from '../models/ReturnRequest.js';

/**
 * Return Eligibility Service
 * Validates return/exchange eligibility based on product policy,
 * order completion timestamp, return window, and duplicate requests.
 */
class ReturnEligibilityService {
  /**
   * Check eligibility for a specific order item
   */
  static async checkItemEligibility(orderId, itemId, userId = null) {
    const query = { _id: orderId };
    if (userId) {
      query.userId = userId;
    }

    const order = await Order.findOne(query);
    if (!order) {
      return { isEligible: false, reason: 'Order not found or unauthorized.' };
    }

    // 1. Order must be completed
    if (order.status !== 'completed') {
      return {
        isEligible: false,
        reason: `Order is not completed yet (current status: "${order.status.toUpperCase()}"). Returns are only available after delivery/pickup.`,
      };
    }

    // 2. Find the ordered item
    const orderItem = order.items.find(
      (item) => item.productId.toString() === itemId.toString() || item._id.toString() === itemId.toString()
    );

    if (!orderItem) {
      return { isEligible: false, reason: 'Item does not belong to this order.' };
    }

    const product = await Product.findById(orderItem.productId);
    if (!product) {
      return { isEligible: false, reason: 'Product is no longer available in the catalog.' };
    }

    // 3. Product returnable policy check
    if (!product.isReturnable) {
      return {
        isEligible: false,
        reason: 'This product is non-returnable per store grocery policy.',
        product,
      };
    }

    // 4. Return Window calculation
    const returnWindowHours = product.returnWindowHours || 24;
    const completedHistory = order.statusHistory?.find((h) => h.status === 'completed');
    const completionTime = completedHistory ? new Date(completedHistory.timestamp) : new Date(order.updatedAt || order.createdAt);
    const now = new Date();

    const elapsedHours = (now - completionTime) / (1000 * 60 * 60);
    const timeRemainingHours = Math.max(0, Math.round((returnWindowHours - elapsedHours) * 10) / 10);

    if (elapsedHours > returnWindowHours) {
      return {
        isEligible: false,
        reason: `Return window expired (${returnWindowHours} hours allowed from delivery). Elapsed: ${Math.round(elapsedHours)}h.`,
        product,
        timeRemainingHours: 0,
      };
    }

    // 5. Existing Return Request check
    const existingRequest = await ReturnRequest.findOne({
      orderId: order._id,
      itemId: product._id,
      status: { $in: ['requested', 'approved', 'completed'] },
    });

    if (existingRequest) {
      return {
        isEligible: false,
        reason: `A return/exchange request is already ${existingRequest.status} for this item.`,
        product,
        existingRequest,
      };
    }

    return {
      isEligible: true,
      reason: 'Item is eligible for return or exchange.',
      product,
      orderItem,
      timeRemainingHours,
      order,
    };
  }

  /**
   * Create a new ReturnRequest after verifying eligibility
   */
  static async createReturnRequest(userId, { orderId, itemId, type, reason, evidenceUrls = [] }) {
    if (!['return', 'exchange'].includes(type)) {
      throw new Error('Invalid return type. Must be "return" or "exchange".');
    }

    if (!reason || !reason.trim()) {
      throw new Error('Please provide a reason for the return/exchange request.');
    }

    const eligibility = await this.checkItemEligibility(orderId, itemId, userId);
    if (!eligibility.isEligible) {
      throw new Error(eligibility.reason);
    }

    const newRequest = await ReturnRequest.create({
      orderId,
      itemId: eligibility.product._id,
      type,
      reason: reason.trim(),
      status: 'requested',
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
    });

    return newRequest;
  }
}

export default ReturnEligibilityService;
