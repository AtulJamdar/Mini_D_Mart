import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Razorpay Integration Service
 * Manages order creation in paise, cryptographic HMAC SHA256 signature verification,
 * webhook validation, and automated refunds.
 */

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_id && key_secret) {
    return new Razorpay({ key_id, key_secret });
  }
  return null;
};

let razorpayClient = getRazorpayInstance();

export const refreshRazorpayClient = () => {
  razorpayClient = getRazorpayInstance();
  return razorpayClient;
};

/**
 * Creates a Razorpay Order
 * @param {Object} params - { amount (paise), currency, receipt, notes }
 */
export const createRazorpayOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  if (!amount || amount < 100) {
    throw new Error('Valid order amount in paise is required (minimum 100 paise).');
  }

  // 1. Real Razorpay API call
  if (razorpayClient) {
    try {
      const order = await razorpayClient.orders.create({
        amount: Math.round(amount),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes,
      });
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
      };
    } catch (err) {
      console.error('[RAZORPAY API ERROR] Order creation failed:', err.message);
      throw new Error(`Razorpay order creation failed: ${err.message}`);
    }
  }

  // 2. Local dev & testing simulation
  const mockOrderId = `order_mock_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  console.log(`[RAZORPAY DEV MOCK] Created order "${mockOrderId}" for amount: ${amount} paise (₹${(amount / 100).toFixed(2)})`);

  return {
    id: mockOrderId,
    amount: Math.round(amount),
    currency,
    status: 'created',
  };
};

/**
 * Verifies the payment signature returned by Razorpay Checkout modal
 * Scheme: HMAC_SHA256(order_id + "|" + payment_id, secret) === signature
 */
export const verifySignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_mock';
  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  // Constant-time buffer comparison with strict length check
  try {
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
};

/**
 * Verifies Razorpay Webhook signature (raw body buffer)
 */
export const verifyWebhookSignature = (rawBody, signature, secret) => {
  if (!rawBody || !signature) return false;

  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_mock';

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
    .digest('hex');

  try {
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
};

/**
 * Issues a full or partial refund for a Razorpay payment
 */
export const issueRefund = async ({ paymentId, amount, notes = {} }) => {
  if (!paymentId) throw new Error('Payment ID is required to process a refund.');

  // 1. Real Razorpay API call
  if (razorpayClient) {
    try {
      const options = { notes };
      if (amount) options.amount = Math.round(amount);

      const refund = await razorpayClient.payments.refund(paymentId, options);
      return {
        id: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (err) {
      console.error(`[RAZORPAY REFUND ERROR] Payment ${paymentId}:`, err.message);
      throw new Error(`Razorpay refund failed: ${err.message}`);
    }
  }

  // 2. Local dev & testing simulation
  const mockRefundId = `rfnd_mock_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  console.log(`[RAZORPAY DEV MOCK] Refund "${mockRefundId}" processed for payment "${paymentId}" (amount: ${amount || 'full'})`);

  return {
    id: mockRefundId,
    paymentId,
    amount: amount || 0,
    status: 'processed',
    notes,
  };
};

export default {
  createRazorpayOrder,
  verifySignature,
  verifyWebhookSignature,
  issueRefund,
  refreshRazorpayClient,
};
