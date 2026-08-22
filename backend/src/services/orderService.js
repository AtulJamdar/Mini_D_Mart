import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import PickupSlot from '../models/PickupSlot.js';
import Store from '../models/Store.js';
import AuditLoggerService from './auditLogger.service.js';

// Explicit Order Lifecycle State Machine Map
const ALLOWED_TRANSITIONS = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: {
    pickup: ['ready_for_pickup'],
    delivery: ['out_for_delivery'],
  },
  ready_for_pickup: ['completed'],
  out_for_delivery: ['completed'],
  completed: [],
  cancelled: [],
};

class OrderService {
  /**
   * Validate state transition against the explicit state machine
   */
  static validateTransition(currentStatus, targetStatus, fulfillmentType) {
    const normCurrent = currentStatus.toLowerCase();
    const normTarget = targetStatus.toLowerCase();

    if (normCurrent === normTarget) {
      throw new Error(`Order is already in "${normCurrent}" status.`);
    }

    const transitions = ALLOWED_TRANSITIONS[normCurrent];
    if (!transitions) {
      throw new Error(`Unknown current order status: "${normCurrent}".`);
    }

    let allowed = [];
    if (Array.isArray(transitions)) {
      allowed = transitions;
    } else if (typeof transitions === 'object') {
      allowed = transitions[fulfillmentType] || [];
    }

    if (!allowed.includes(normTarget)) {
      throw new Error(
        `Invalid status transition from "${normCurrent.toUpperCase()}" to "${normTarget.toUpperCase()}". Allowed next states: [${allowed.map((s) => s.toUpperCase()).join(', ') || 'NONE - Terminal State'}].`
      );
    }

    return normTarget;
  }

  /**
   * Helper: Restore inventory and release pickup slot on order cancellation
   */
  static async restoreInventoryAndSlot(order) {
    // Restore Product stock
    for (const item of order.items) {
      try {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.qty },
        });
      } catch (err) {
        console.error(`[Restitution Error] Failed to restore product ${item.productId}:`, err.message);
      }
    }

    // Restore Pickup Slot booking if pickup order
    if (order.fulfillmentType === 'pickup' && order.pickupSlotId) {
      try {
        await PickupSlot.findByIdAndUpdate(order.pickupSlotId, {
          $inc: { bookedCount: -1 },
        });
      } catch (err) {
        console.error(`[Restitution Error] Failed to release slot ${order.pickupSlotId}:`, err.message);
      }
    }
  }

  /**
   * Transition order status via State Machine
   */
  static async transitionOrderStatus(orderId, newStatus, { actorId, actorRole = 'staff', note = '' }) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    const validatedStatus = this.validateTransition(
      order.status,
      newStatus,
      order.fulfillmentType
    );

    // If transitioning to CANCELLED, restore inventory
    if (validatedStatus === 'cancelled') {
      await this.restoreInventoryAndSlot(order);
    }

    const previousStatus = order.status;
    order.status = validatedStatus;
    order.statusHistory.push({
      status: validatedStatus,
      timestamp: new Date(),
      note: note || `Status updated from ${previousStatus.toUpperCase()} to ${validatedStatus.toUpperCase()} by ${actorRole}.`,
      updatedBy: actorId,
    });

    await order.save();

    await AuditLoggerService.logEvent({
      userId: actorId,
      action: 'ORDER_STATUS_TRANSITION',
      resource: 'ORDER',
      resourceId: order._id,
      metadata: {
        from: previousStatus,
        to: validatedStatus,
        actorRole,
        note,
      },
    });

    return order;
  }

  /**
   * Customer Self-Cancellation (Allowed only from PLACED or CONFIRMED)
   */
  static async cancelOrder(orderId, userId, note = 'Cancelled by customer') {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      throw new Error('Order not found or does not belong to this account.');
    }

    if (!['placed', 'confirmed'].includes(order.status)) {
      throw new Error(
        `Order cannot be cancelled in "${order.status.toUpperCase()}" status. Cancellation is only allowed when order is PLACED or CONFIRMED.`
      );
    }

    return this.transitionOrderStatus(order._id, 'cancelled', {
      actorId: userId,
      actorRole: 'customer',
      note,
    });
  }

  /**
   * Process checkout with initial state PLACED
   */
  static async checkout(userId, { fulfillmentType, storeId, pickupSlotId, address }) {
    const cart = await Cart.findOne({ userId });
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Your cart is empty. Please add items before checking out.');
    }

    if (!['pickup', 'delivery'].includes(fulfillmentType)) {
      throw new Error('Invalid fulfillment type. Must be "pickup" or "delivery".');
    }

    let reservedSlot = null;
    let selectedStoreId = storeId;

    if (fulfillmentType === 'pickup') {
      if (!storeId || !pickupSlotId) {
        throw new Error('Pickup orders require both storeId and pickupSlotId.');
      }
      const store = await Store.findById(storeId);
      if (!store || !store.isActive) throw new Error('Selected store is not available.');

      const slot = await PickupSlot.findOne({ _id: pickupSlotId, storeId });
      if (!slot) throw new Error('Selected pickup slot does not exist.');
      if (slot.bookedCount >= slot.maxOrders) {
        throw new Error(`Pickup slot is full (${slot.bookedCount}/${slot.maxOrders}). Choose another slot.`);
      }

      reservedSlot = await PickupSlot.findOneAndUpdate(
        { _id: pickupSlotId, storeId, bookedCount: { $lt: slot.maxOrders } },
        { $inc: { bookedCount: 1 } },
        { new: true }
      );
      if (!reservedSlot) throw new Error('Pickup slot just reached full capacity.');
    }

    let deliveryAddress = null;
    if (fulfillmentType === 'delivery') {
      if (!address?.street || !address?.city || !address?.state || !address?.pincode) {
        throw new Error('Delivery orders require complete address (street, city, state, pincode).');
      }
      deliveryAddress = {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
      };
      if (!selectedStoreId) {
        const defaultStore = await Store.findOne({ isActive: true });
        if (!defaultStore) throw new Error('No active store available for delivery.');
        selectedStoreId = defaultStore._id;
      }
    }

    // Atomic Stock Verification & Decrement
    const decrementedProducts = [];
    const orderItems = [];
    let subtotal = 0;

    try {
      for (const item of cart.items) {
        const product = await Product.findById(item.productId);
        if (!product) throw new Error(`Product "${item.productId}" not found.`);

        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } },
          { new: true }
        );

        if (!updatedProduct) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.qty}.`);
        }

        decrementedProducts.push({ productId: item.productId, qty: item.qty });
        subtotal += product.price * item.qty;
        orderItems.push({ productId: product._id, qty: item.qty, priceAtOrder: product.price });
      }

      const tax = Math.round(subtotal * 0.05 * 100) / 100;
      const totalAmount = Math.round((subtotal + tax) * 100) / 100;

      const order = await Order.create({
        userId,
        items: orderItems,
        status: 'placed',
        fulfillmentType,
        storeId: selectedStoreId,
        pickupSlotId: fulfillmentType === 'pickup' ? pickupSlotId : undefined,
        address: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
        totalAmount,
        statusHistory: [
          {
            status: 'placed',
            timestamp: new Date(),
            note: 'Order placed by customer.',
            updatedBy: userId,
          },
        ],
      });

      cart.items = [];
      await cart.save();

      return order;
    } catch (err) {
      for (const p of decrementedProducts) {
        await Product.findByIdAndUpdate(p.productId, { $inc: { stock: p.qty } }).catch(() => {});
      }
      if (reservedSlot) {
        await PickupSlot.findByIdAndUpdate(pickupSlotId, { $inc: { bookedCount: -1 } }).catch(() => {});
      }
      throw err;
    }
  }

  /**
   * Get paginated orders
   */
  static async getOrdersPaginated({ userId = null, role = 'customer', storeId = null, page = 1, limit = 10, status = null }) {
    const filter = {};
    if (role === 'customer' || userId) {
      filter.userId = userId;
    }
    if (storeId && ['store_staff', 'store_manager'].includes(role)) {
      filter.storeId = storeId;
    }
    if (status) {
      filter.status = status.toLowerCase();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.productId', 'name price unit images')
        .populate('storeId', 'name address')
        .populate('pickupSlotId', 'startTime endTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get single order by ID with populated references
   */
  static async getOrderById(orderId, userId = null, role = 'customer') {
    const query = { _id: orderId };
    if (role === 'customer' && userId) {
      query.userId = userId;
    }

    const order = await Order.findOne(query)
      .populate('items.productId', 'name price unit images')
      .populate('storeId', 'name address')
      .populate('pickupSlotId', 'startTime endTime')
      .populate('statusHistory.updatedBy', 'name role');

    if (!order) {
      throw new Error('Order not found or unauthorized.');
    }
    return order;
  }
}

export default OrderService;
