import ReturnRequest from '../models/ReturnRequest.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import AuditLoggerService from './auditLogger.service.js';

class ReturnService {
  /**
   * Approve a Return or Exchange request (Store Manager / Admin)
   */
  static async approveReturnRequest(requestId, managerId) {
    const request = await ReturnRequest.findById(requestId)
      .populate('orderId')
      .populate('itemId');

    if (!request) {
      throw new Error('Return request not found.');
    }

    if (request.status !== 'requested') {
      throw new Error(`Cannot approve a return request that is already "${request.status}".`);
    }

    const order = request.orderId;
    const product = request.itemId;
    const orderItem = order?.items?.find(
      (i) => i.productId.toString() === product._id.toString()
    );
    const itemQty = orderItem ? orderItem.qty : 1;

    let linkedReplacementOrder = null;

    if (request.type === 'return') {
      // 1. Restock inventory for the returned product
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: itemQty },
      });
    } else if (request.type === 'exchange') {
      // 2. Atomic stock check & decrement for replacement
      const replacementProduct = await Product.findOneAndUpdate(
        {
          _id: product._id,
          stock: { $gte: itemQty },
        },
        {
          $inc: { stock: -itemQty },
        },
        { new: true }
      );

      if (!replacementProduct) {
        throw new Error(
          `Insufficient stock to fulfill exchange for "${product.name}". Available stock is less than ${itemQty}.`
        );
      }

      // Create linked replacement order
      linkedReplacementOrder = await Order.create({
        userId: order.userId,
        items: [
          {
            productId: product._id,
            qty: itemQty,
            priceAtOrder: 0, // Replacement item is complimentary
          },
        ],
        status: 'confirmed',
        fulfillmentType: order.fulfillmentType,
        storeId: order.storeId,
        pickupSlotId: order.pickupSlotId,
        address: order.address,
        totalAmount: 0,
        statusHistory: [
          {
            status: 'confirmed',
            timestamp: new Date(),
            note: `Exchange replacement order created for approved ReturnRequest #${request._id}.`,
            updatedBy: managerId,
          },
        ],
      });
    }

    request.status = 'approved';
    request.resolvedBy = managerId;
    request.resolvedAt = new Date();
    await request.save();

    await AuditLoggerService.logEvent({
      userId: managerId,
      action: `RETURN_REQUEST_APPROVED_${request.type.toUpperCase()}`,
      resource: 'RETURN_REQUEST',
      resourceId: request._id,
      metadata: {
        type: request.type,
        orderId: order._id,
        productId: product._id,
        replacementOrderId: linkedReplacementOrder?._id || null,
      },
    });

    return {
      request,
      replacementOrder: linkedReplacementOrder,
    };
  }

  /**
   * Reject a Return or Exchange request (Store Manager / Admin)
   */
  static async rejectReturnRequest(requestId, managerId, rejectionReason = 'Rejected by store manager') {
    const request = await ReturnRequest.findById(requestId);
    if (!request) {
      throw new Error('Return request not found.');
    }

    if (request.status !== 'requested') {
      throw new Error(`Cannot reject a return request that is already "${request.status}".`);
    }

    request.status = 'rejected';
    request.resolvedBy = managerId;
    request.resolvedAt = new Date();
    request.reason = `${request.reason} | Manager Rejection Note: ${rejectionReason}`;
    await request.save();

    await AuditLoggerService.logEvent({
      userId: managerId,
      action: 'RETURN_REQUEST_REJECTED',
      resource: 'RETURN_REQUEST',
      resourceId: request._id,
      metadata: {
        rejectionReason,
      },
    });

    return request;
  }

  /**
   * Get return requests (for customer: own; for manager/staff: store queue)
   */
  static async getReturns({ userId, role = 'customer', status = null, storeId = null }) {
    if (role === 'customer') {
      // Find orders belonging to user
      const userOrders = await Order.find({ userId }).select('_id');
      const orderIds = userOrders.map((o) => o._id);

      const filter = { orderId: { $in: orderIds } };
      if (status) filter.status = status;

      return ReturnRequest.find(filter)
        .populate('orderId', '_id totalAmount createdAt fulfillmentType')
        .populate('itemId', 'name price unit images')
        .populate('resolvedBy', 'name role')
        .sort({ createdAt: -1 });
    }

    // Manager / Staff view: all or store-filtered requests
    const filter = {};
    if (status) {
      filter.status = status;
    }

    return ReturnRequest.find(filter)
      .populate({
        path: 'orderId',
        select: '_id userId totalAmount createdAt fulfillmentType storeId address',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate('itemId', 'name price unit images stock')
      .populate('resolvedBy', 'name role')
      .sort({ createdAt: -1 });
  }
}

export default ReturnService;
