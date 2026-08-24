import Order from '../models/Order.js';
import Product from '../models/Product.js';
import PickupSlot from '../models/PickupSlot.js';
import AuditLoggerService from './auditLogger.service.js';

export const ORDER_STATE_TRANSITIONS = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'out_for_delivery'],
  ready_for_pickup: ['completed'],
  out_for_delivery: ['completed'],
  completed: [],
  cancelled: [],
};

export class OrderStatusService {
  static getAllowedNextStates(currentStatus) {
    const norm = (currentStatus || '').toLowerCase();
    return ORDER_STATE_TRANSITIONS[norm] || [];
  }

  static validateTransition(currentStatus, targetStatus, fulfillmentType) {
    const normCurrent = (currentStatus || '').toLowerCase();
    const normTarget = (targetStatus || '').toLowerCase();
    const allowed = ORDER_STATE_TRANSITIONS[normCurrent] || [];

    if (!allowed.includes(normTarget)) {
      throw new Error(`Invalid status transition from "${normCurrent.toUpperCase()}" to "${normTarget.toUpperCase()}".`);
    }

    if (normTarget === 'ready_for_pickup' && fulfillmentType !== 'pickup') {
      throw new Error('Status "ready_for_pickup" is only valid for pickup orders.');
    }
    if (normTarget === 'out_for_delivery' && fulfillmentType !== 'delivery') {
      throw new Error('Status "out_for_delivery" is only valid for delivery orders.');
    }
    return normTarget;
  }

  static async restoreInventoryAndSlot(order) {
    for (const item of order.items) {
      try {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } });
      } catch (err) {
        console.error(`[Restitution Error] product ${item.productId}:`, err.message);
      }
    }
    if (order.fulfillmentType === 'pickup' && order.pickupSlotId) {
      try {
        await PickupSlot.findByIdAndUpdate(order.pickupSlotId, { $inc: { bookedCount: -1 } });
      } catch (err) {
        console.error(`[Restitution Error] slot ${order.pickupSlotId}:`, err.message);
      }
    }
  }

  static async transitionOrderStatus(orderId, newStatus, { actorId, actorRole = 'staff', note = '' }) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found.');

    const validatedStatus = this.validateTransition(order.status, newStatus, order.fulfillmentType);

    if (validatedStatus === 'cancelled') {
      await this.restoreInventoryAndSlot(order);
    }

    order.status = validatedStatus;
    order.statusHistory.push({
      status: validatedStatus,
      timestamp: new Date(),
      actor: actorId || undefined,
      actorRole: actorRole || 'system',
      note: note ? note.trim() : `Status transitioned to ${validatedStatus.toUpperCase()}`,
    });

    await order.save();

    await AuditLoggerService.logEvent({
      userId: actorId || null,
      action: `ORDER_STATUS_${validatedStatus.toUpperCase()}`,
      resource: 'ORDER',
      resourceId: order._id,
      metadata: { orderId: order._id, newStatus: validatedStatus, fulfillmentType: order.fulfillmentType },
    });

    return order;
  }

  static async cancelOrder(orderId, userId, note = 'Cancelled by customer') {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw new Error('Order not found or you are not authorized to cancel it.');

    const allowed = ['placed', 'confirmed'];
    if (!allowed.includes(order.status)) {
      throw new Error(`Order cannot be cancelled in "${order.status.toUpperCase()}" status. Only PLACED or CONFIRMED orders are eligible.`);
    }

    return this.transitionOrderStatus(order._id, 'cancelled', {
      actorId: userId,
      actorRole: 'customer',
      note,
    });
  }
}

export default OrderStatusService;
