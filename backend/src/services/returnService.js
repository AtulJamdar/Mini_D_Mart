import ReturnRequest from '../models/ReturnRequest.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import AuditLoggerService from './auditLogger.service.js';
import razorpayService from './razorpayService.js';

class ReturnService {
  /**
   * Issue Razorpay refund for an approved Return request (Store Manager / Admin)
   * Enforces atomic idempotency to strictly prevent duplicate refunds.
   */
  static async refundReturnRequest(requestId, managerId) {
    // 1. Atomic status transition from 'approved' to 'refunding' prevents duplicate concurrent / subsequent refunds
    const request = await ReturnRequest.findOneAndUpdate(
      { _id: requestId, status: 'approved', type: 'return' },
      { $set: { status: 'refunding' } },
      { returnDocument: 'after' }
    )
      .populate('orderId')
      .populate('itemId');

    if (!request) {
      const existing = await ReturnRequest.findById(requestId);
      if (!existing) {
        throw new Error('Return request not found.');
      }
      if (existing.status === 'completed') {
        throw new Error('This return request has already been refunded. Duplicate refund prevented.');
      }
      if (existing.status === 'refunding') {
        throw new Error('This return request is currently being processed for refund.');
      }
      if (existing.status !== 'approved') {
        throw new Error(`Cannot refund a return request in "${existing.status}" status. It must be "approved" first.`);
      }
      if (existing.type !== 'return') {
        throw new Error('Only return requests (not exchanges) are eligible for monetary refunds.');
      }
      throw new Error('Return request could not be processed for refund.');
    }

    const order = request.orderId;
    const paymentId = order?.paymentDetails?.razorpayPaymentId;

    if (!paymentId) {
      // Rollback status
      await ReturnRequest.findByIdAndUpdate(requestId, { status: 'approved' });
      throw new Error('No Razorpay payment ID found on the order to issue automated refund.');
    }

    const product = request.itemId;
    const orderItem = order?.items?.find(
      (i) => i.productId.toString() === product._id.toString()
    );
    const itemAmount = orderItem ? orderItem.priceAtOrder * orderItem.qty : product.price;
    const amountPaise = Math.round(itemAmount * 100);

    let refund;
    try {
      refund = await razorpayService.issueRefund({
        paymentId,
        amount: amountPaise,
        notes: {
          returnRequestId: request._id.toString(),
          orderId: order._id.toString(),
          productId: product._id.toString(),
        },
      });
    } catch (refundErr) {
      // Rollback status on failure so it can be retried safely
      await ReturnRequest.findByIdAndUpdate(requestId, { status: 'approved' });
      throw refundErr;
    }

    request.status = 'completed';
    request.resolvedAt = new Date();
    request.resolvedBy = managerId;
    await request.save();

    await AuditLoggerService.logEvent({
      userId: managerId,
      action: 'REFUND_ISSUED',
      resource: 'RETURN_REQUEST',
      resourceId: request._id,
      metadata: {
        orderId: order._id,
        paymentId,
        refundId: refund.id,
        amount: amountPaise,
        refundedBy: managerId,
      },
    });

    return {
      request,
      refund,
    };
  }

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

    if (storeId) {
      const storeOrders = await Order.find({ storeId }).select('_id');
      const orderIds = storeOrders.map((o) => o._id);
      filter.orderId = { $in: orderIds };
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
