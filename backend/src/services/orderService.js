import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import PickupSlot from '../models/PickupSlot.js';
import Store from '../models/Store.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import AuditLoggerService from './auditLogger.service.js';
import emailService from './emailService.js';
import razorpayService from './razorpayService.js';
import OrderStatusService from './orderStatusService.js';

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD, 10) || 5;

class OrderService {
  // Delegate state machine methods to OrderStatusService
  static getAllowedNextStates(currentStatus) {
    return OrderStatusService.getAllowedNextStates(currentStatus);
  }

  static validateTransition(currentStatus, targetStatus, fulfillmentType) {
    return OrderStatusService.validateTransition(currentStatus, targetStatus, fulfillmentType);
  }

  static restoreInventoryAndSlot(order) {
    return OrderStatusService.restoreInventoryAndSlot(order);
  }

  static transitionOrderStatus(orderId, newStatus, options) {
    return OrderStatusService.transitionOrderStatus(orderId, newStatus, options);
  }

  static cancelOrder(orderId, userId, note) {
    return OrderStatusService.cancelOrder(orderId, userId, note);
  }

  /**
   * Phase 1: Prepare checkout session and create a Razorpay Order
   * Validates cart, stock, and slot availability; stores pending Payment reference.
   */
  static async prepareCheckoutSession(userId, { fulfillmentType, storeId, pickupSlotId, address }) {
    const cart = await Cart.findOne({ userId });
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Your cart is empty. Please add items before checking out.');
    }

    if (!['pickup', 'delivery'].includes(fulfillmentType)) {
      throw new Error('Invalid fulfillment type. Must be "pickup" or "delivery".');
    }

    let selectedStoreId = storeId;

    if (fulfillmentType === 'pickup') {
      if (!storeId || !pickupSlotId) throw new Error('Pickup orders require both storeId and pickupSlotId.');
      const store = await Store.findById(storeId);
      if (!store || !store.isActive) throw new Error('Selected store is not available.');

      const slot = await PickupSlot.findOne({ _id: pickupSlotId, storeId });
      if (!slot) throw new Error('Selected pickup slot does not exist.');
      if (slot.bookedCount >= slot.maxOrders) {
        throw new Error(`Pickup slot is full (${slot.bookedCount}/${slot.maxOrders}). Choose another slot.`);
      }
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

    // Preliminary inventory and price validation
    const checkoutItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error(`Product "${item.productId}" not found.`);
      if (product.stock < item.qty) {
        throw new Error(`Insufficient stock for "${product.name}". Only ${product.stock} units available.`);
      }
      checkoutItems.push({
        productId: product._id,
        name: product.name,
        qty: item.qty,
        price: product.price,
      });
      subtotal += product.price * item.qty;
    }

    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
    const deliveryFee = fulfillmentType === 'delivery' && subtotal < 500 ? 30.0 : 0.0;
    const totalAmount = Math.round((subtotal + taxAmount + deliveryFee) * 100) / 100;
    const amountPaise = Math.round(totalAmount * 100);

    // Create Razorpay Order via SDK / Mock
    const razorpayOrder = await razorpayService.createRazorpayOrder({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { userId: userId.toString(), fulfillmentType },
    });

    const payment = await Payment.create({
      userId,
      razorpayOrderId: razorpayOrder.id,
      amount: amountPaise,
      currency: 'INR',
      status: 'created',
      checkoutDetails: {
        fulfillmentType,
        storeId: selectedStoreId,
        pickupSlotId: fulfillmentType === 'pickup' ? pickupSlotId : undefined,
        address: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
        items: checkoutItems,
        subtotal,
        taxAmount,
        deliveryFee,
        totalAmount,
      },
    });

    return {
      paymentId: payment._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
      metadata: {
        totalAmount,
        subtotal,
        taxAmount,
        deliveryFee,
      },
    };
  }

  /**
   * Phase 2: Complete order upon verified payment (Client verify or Webhook)
   * Enforces atomic idempotency, stock/slot re-check, and automatic refund on sellout.
   */
  static async completeOrderFromPayment(razorpayOrderId, { paymentId, signature, verifiedVia = 'client' }) {
    // 1. Atomic status check & lock
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId, status: { $in: ['created', 'processing'] } },
      {
        $set: {
          status: 'processing',
          razorpayPaymentId: paymentId || undefined,
          razorpaySignature: signature || undefined,
        },
      },
      { returnDocument: 'after' }
    );

    if (!payment) {
      const existing = await Payment.findOne({ razorpayOrderId });
      if (existing && existing.status === 'paid' && existing.orderId) {
        const order = await Order.findById(existing.orderId)
          .populate('items.productId', 'name price images unit')
          .populate('storeId', 'name address');
        return { success: true, order, alreadyProcessed: true };
      }
      if (existing && existing.status === 'refunded_insufficient_stock') {
        return {
          success: false,
          refunded: true,
          statusCode: 409,
          message: 'Payment received, but an item sold out before order could be finalized. A full refund has already been issued.',
        };
      }
      throw new Error('Payment record not found or already finalized.');
    }

    const { checkoutDetails, userId } = payment;
    const decrementedProducts = [];
    let stockFailure = null;

    // 2. Atomic Stock & Slot Re-Check & Decrement
    try {
      for (const item of checkoutDetails.items) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } },
          { returnDocument: 'after' }
        );

        if (!updatedProduct) {
          const currentProd = await Product.findById(item.productId);
          throw new Error(`Insufficient stock for "${currentProd ? currentProd.name : item.name}". Only ${currentProd ? currentProd.stock : 0} available.`);
        }

        decrementedProducts.push({ productId: item.productId, qty: item.qty, product: updatedProduct });
      }

      if (checkoutDetails.fulfillmentType === 'pickup' && checkoutDetails.pickupSlotId) {
        const slot = await PickupSlot.findById(checkoutDetails.pickupSlotId);
        if (!slot || slot.bookedCount >= slot.maxOrders) {
          throw new Error('Selected pickup slot is full. Choose another slot.');
        }
        const reservedSlot = await PickupSlot.findOneAndUpdate(
          { _id: checkoutDetails.pickupSlotId, bookedCount: { $lt: slot.maxOrders } },
          { $inc: { bookedCount: 1 } },
          { returnDocument: 'after' }
        );
        if (!reservedSlot) {
          throw new Error('Selected pickup slot is full. Choose another slot.');
        }
      }
    } catch (err) {
      stockFailure = err;
      // Rollback any products decremented before the failure
      for (const rollback of decrementedProducts) {
        await Product.findByIdAndUpdate(rollback.productId, { $inc: { stock: rollback.qty } }).catch(() => {});
      }
    }

    // 3. Handle Race Condition: Auto-Refund when items/slots sell out
    if (stockFailure) {
      console.warn(`[AUTO-REFUND] Out of stock race condition for Razorpay Order ${razorpayOrderId}. Initiating refund...`);
      let refundResult = null;
      try {
        if (paymentId) {
          refundResult = await razorpayService.issueRefund({
            paymentId,
            amount: payment.amount,
            notes: { reason: 'insufficient_stock_or_slot_at_completion', error: stockFailure.message },
          });
        }
      } catch (refundErr) {
        console.error('[AUTO-REFUND ERROR] Failed to issue refund:', refundErr.message);
      }

      payment.status = 'refunded_insufficient_stock';
      payment.refundDetails = {
        refundId: refundResult?.id || `rfnd_pending_${Date.now()}`,
        amount: payment.amount,
        reason: stockFailure.message,
        timestamp: new Date(),
      };
      await payment.save();

      await AuditLoggerService.logEvent({
        userId,
        action: 'PAYMENT_AUTO_REFUNDED_STOCK_UNAVAILABLE',
        resource: 'PAYMENT',
        resourceId: payment._id,
        metadata: { razorpayOrderId, razorpayPaymentId: paymentId, error: stockFailure.message },
      });

      return {
        success: false,
        refunded: true,
        statusCode: 409,
        message: stockFailure.message,
      };
    }

    // 4. Low stock threshold warnings
    for (const dec of decrementedProducts) {
      if (dec.product.stock <= LOW_STOCK_THRESHOLD) {
        (async () => {
          try {
            const alertStore = await Store.findById(dec.product.storeId);
            await emailService.sendLowStockAlert({
              product: dec.product,
              store: alertStore,
              currentStock: dec.product.stock,
              threshold: LOW_STOCK_THRESHOLD,
            });
          } catch (e) {
            console.error(`[LowStockAlert Error] Product ${dec.product.name}:`, e.message);
          }
        })();
      }
    }

    // 5. Create Order Document
    const orderItems = checkoutDetails.items.map((i) => ({
      productId: i.productId,
      qty: i.qty,
      priceAtOrder: i.price,
    }));

    const order = await Order.create({
      userId,
      items: orderItems,
      status: 'placed',
      fulfillmentType: checkoutDetails.fulfillmentType,
      storeId: checkoutDetails.storeId,
      pickupSlotId: checkoutDetails.pickupSlotId,
      address: checkoutDetails.address,
      subtotal: checkoutDetails.subtotal,
      taxAmount: checkoutDetails.taxAmount,
      deliveryFee: checkoutDetails.deliveryFee,
      totalAmount: checkoutDetails.totalAmount,
      paymentDetails: {
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        status: 'paid',
      },
      statusHistory: [
        {
          status: 'placed',
          timestamp: new Date(),
          actor: userId,
          actorRole: 'customer',
          note: `Order placed via verified Razorpay payment (${verifiedVia})`,
        },
      ],
    });

    // 6. Update Payment & Clear Cart
    payment.status = 'paid';
    payment.orderId = order._id;
    if (paymentId) payment.razorpayPaymentId = paymentId;
    if (signature) payment.razorpaySignature = signature;
    await payment.save();

    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

    await AuditLoggerService.logEvent({
      userId,
      action: 'ORDER_CREATED_PAID',
      resource: 'ORDER',
      resourceId: order._id,
      metadata: {
        totalAmount: order.totalAmount,
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        fulfillmentType: order.fulfillmentType,
      },
    });

    // 7. Send Order Confirmation Email asynchronously
    (async () => {
      try {
        const customer = await User.findById(userId);
        const orderWithDetails = await Order.findById(order._id)
          .populate('items.productId', 'name price images unit')
          .populate('storeId', 'name address');
        const storeObj = orderWithDetails?.storeId || (await Store.findById(checkoutDetails.storeId));

        await emailService.sendOrderConfirmationEmail({
          order: orderWithDetails || order,
          user: customer,
          store: storeObj,
        });
      } catch (err) {
        console.error('[OrderConfirmation Email Error]:', err.message);
      }
    })();

    const populatedOrder = await Order.findById(order._id)
      .populate('items.productId', 'name price images unit')
      .populate('storeId', 'name address');

    return { success: true, order: populatedOrder || order };
  }

  /**
   * Direct checkout helper (executes prepare + complete flow)
   */
  static async checkout(userId, { fulfillmentType, storeId, pickupSlotId, address }) {
    const session = await this.prepareCheckoutSession(userId, {
      fulfillmentType,
      storeId,
      pickupSlotId,
      address,
    });

    const mockPaymentId = `pay_direct_${Date.now()}`;
    const mockSignature = `sig_direct_${Date.now()}`;

    const result = await this.completeOrderFromPayment(session.razorpayOrderId, {
      paymentId: mockPaymentId,
      signature: mockSignature,
      verifiedVia: 'direct_checkout',
    });

    if (result.refunded) {
      throw new Error(result.message);
    }

    return result.order;
  }

  static async getOrdersPaginated({ userId, role = 'customer', storeId = null, page = 1, limit = 10, status = null } = {}) {
    const filter = {};
    if (role === 'customer' && userId) {
      filter.userId = userId;
    }
    if (storeId) {
      filter.storeId = storeId;
    }
    if (status) {
      filter.status = status;
    }
    return this.getOrders(filter, { page, limit });
  }

  static async getOrders(filter = {}, { page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.productId', 'name price images unit')
        .populate('storeId', 'name address')
        .populate('pickupSlotId', 'startTime endTime')
        .populate('userId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    return { orders, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 } };
  }

  static async getOrderById(orderId, userId = null, role = null) {
    const order = await Order.findById(orderId)
      .populate('items.productId', 'name price images unit isReturnable returnWindowHours')
      .populate('storeId', 'name address geo')
      .populate('pickupSlotId', 'startTime endTime bookedCount maxOrders')
      .populate('userId', 'name email phone');

    if (!order) throw new Error('Order not found');
    if (role === 'customer' && userId && order.userId._id.toString() !== userId.toString()) {
      throw new Error('You are not authorized to view this order.');
    }
    return order;
  }
}

export default OrderService;
