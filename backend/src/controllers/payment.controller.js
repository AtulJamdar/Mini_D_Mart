import Payment from '../models/Payment.js';
import OrderService from '../services/orderService.js';
import razorpayService from '../services/razorpayService.js';
import AuditLoggerService from '../services/auditLogger.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Initialize Checkout and Create Razorpay Order
 * POST /api/payments/razorpay/order
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { fulfillmentType, storeId, pickupSlotId, address } = req.body;

    const checkoutSession = await OrderService.prepareCheckoutSession(req.user._id, {
      fulfillmentType,
      storeId,
      pickupSlotId,
      address,
    });

    return sendSuccess(res, {
      statusCode: 200,
      data: checkoutSession,
      message: 'Razorpay order created successfully.',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Failed to create payment order.',
      error: error.message,
    });
  }
};

/**
 * Verify Razorpay Payment Signature and Finalize Order
 * POST /api/payments/razorpay/verify
 */
export const verifyPayment = async (req, res) => {
  try {
    const razorpayOrderId = req.body.razorpay_order_id || req.body.razorpayOrderId;
    const razorpayPaymentId = req.body.razorpay_payment_id || req.body.razorpayPaymentId;
    const razorpaySignature = req.body.razorpay_signature || req.body.razorpaySignature;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return sendError(res, {
        statusCode: 400,
        message: 'Missing required payment verification fields (order id, payment id, or signature).',
      });
    }

    // 1. Ownership validation
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      return sendError(res, {
        statusCode: 404,
        message: 'Payment record not found for this order.',
      });
    }

    if (payment.userId.toString() !== req.user._id.toString()) {
      await AuditLoggerService.logEvent({
        userId: req.user._id,
        action: 'PAYMENT_CROSS_USER_BLOCKED',
        resource: 'PAYMENT',
        resourceId: payment._id,
        metadata: { attemptedBy: req.user._id, paymentOwner: payment.userId, razorpayOrderId },
      });

      return sendError(res, {
        statusCode: 403,
        message: 'You are not authorized to verify this payment record.',
      });
    }

    // 2. Cryptographic signature check with buffer length validation and timing attack protection
    const isValidSignature = razorpayService.verifySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValidSignature) {
      payment.status = 'failed';
      await payment.save();

      await AuditLoggerService.logEvent({
        userId: req.user._id,
        action: 'PAYMENT_SIGNATURE_TAMPERED',
        resource: 'PAYMENT',
        resourceId: payment._id,
        metadata: { razorpayOrderId, razorpayPaymentId },
      });

      return sendError(res, {
        statusCode: 400,
        message: 'Invalid payment signature. Transaction tampering detected, order was not created.',
      });
    }

    // 3. Atomically finalize order (with stock/slot re-check and auto-refund fallback)
    const result = await OrderService.completeOrderFromPayment(razorpayOrderId, {
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      verifiedVia: 'client',
    });

    if (result.refunded) {
      return sendError(res, {
        statusCode: result.statusCode || 409,
        message: result.message,
        error: 'PAYMENT_AUTO_REFUNDED',
      });
    }

    await AuditLoggerService.logEvent({
      userId: req.user._id,
      action: 'PAYMENT_VERIFIED',
      resource: 'PAYMENT',
      resourceId: payment._id,
      metadata: {
        razorpayOrderId,
        razorpayPaymentId,
        orderId: result.order?._id,
        amount: payment.amount,
      },
    });

    return sendSuccess(res, {
      statusCode: 201,
      data: result.order,
      message: 'Payment verified and order confirmed successfully!',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: error.message || 'Payment verification failed.',
      error: error.message,
    });
  }
};

/**
 * Razorpay Webhook Handler (Server-to-Server Fallback)
 * POST /api/payments/razorpay/webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
    }

    const rawBody = req.rawBody || JSON.stringify(req.body);
    const isValid = razorpayService.verifyWebhookSignature(
      rawBody,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.warn('[RAZORPAY WEBHOOK] Invalid webhook signature received.');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const payload = req.body;
    const event = payload?.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const razorpayOrderId = paymentEntity.order_id || payload.payload?.order?.entity?.id;
      const razorpayPaymentId = paymentEntity.id;

      if (razorpayOrderId) {
        console.log(`[RAZORPAY WEBHOOK] Processing ${event} for order: ${razorpayOrderId}`);
        await OrderService.completeOrderFromPayment(razorpayOrderId, {
          paymentId: razorpayPaymentId,
          signature,
          verifiedVia: 'webhook',
        });

        await AuditLoggerService.logEvent({
          userId: null,
          action: 'PAYMENT_WEBHOOK_PROCESSED',
          resource: 'PAYMENT',
          resourceId: null,
          metadata: { event, razorpayOrderId, razorpayPaymentId },
        });
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[RAZORPAY WEBHOOK ERROR]:', error.message);
    return res.status(500).json({ error: 'Webhook processing error', details: error.message });
  }
};

export default {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
};
