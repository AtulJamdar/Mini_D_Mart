import request from 'supertest';
import crypto from 'crypto';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Store from '../src/models/Store.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import Payment from '../src/models/Payment.js';
import ReturnRequest from '../src/models/ReturnRequest.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_mini_dmart_change_in_production';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_mock';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_mock';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

const generateSignature = (orderId, paymentId, secret = RAZORPAY_KEY_SECRET) => {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
};

const setupTestFixtures = async () => {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const customer = await User.create({
    name: 'Rohan Customer',
    email: 'rohan.customer@example.com',
    passwordHash,
    role: 'customer',
  });

  const customerTwo = await User.create({
    name: 'Sneha Customer',
    email: 'sneha.customer@example.com',
    passwordHash,
    role: 'customer',
  });

  const manager = await User.create({
    name: 'Manager Anil',
    email: 'manager.anil@example.com',
    passwordHash,
    role: 'store_manager',
  });

  const token = jwt.sign({ id: customer._id, role: customer.role }, JWT_SECRET, { expiresIn: '1h' });
  const tokenTwo = jwt.sign({ id: customerTwo._id, role: customerTwo.role }, JWT_SECRET, { expiresIn: '1h' });
  const managerToken = jwt.sign({ id: manager._id, role: manager.role }, JWT_SECRET, { expiresIn: '1h' });

  const store = await Store.create({
    name: 'Mini D-Mart Andheri West',
    code: 'DM-MUM-01',
    address: { street: 'Link Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
    geo: { type: 'Point', coordinates: [72.83, 19.13] },
  });

  const category = await Category.create({ name: 'Groceries' });

  const product = await Product.create({
    name: 'Basmati Rice 5kg',
    categoryId: category._id,
    price: 350.0,
    stock: 20,
    unit: '5kg pack',
    storeId: store._id,
  });

  return { customer, customerTwo, manager, token, tokenTwo, managerToken, store, category, product };
};

describe('Razorpay Payment-Gated Checkout & Refund Tests', () => {
  test('POST /api/payments/razorpay/order - creates Razorpay order in paise without exposing secret', async () => {
    const { token, store, product } = await setupTestFixtures();

    // 1. Add 2 units of Rice (₹350 * 2 = ₹700)
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 2 })
      .expect(200);

    // 2. Create Razorpay order
    const res = await request(app)
      .post('/api/payments/razorpay/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fulfillmentType: 'delivery',
        storeId: store._id,
        address: { street: 'Flat 101, Green Heights', city: 'Mumbai', state: 'MH', pincode: '400053' },
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.razorpayOrderId).toBeDefined();
    // Subtotal 700 + 5% GST (35) = ₹735.00 -> 73500 paise
    expect(res.body.data.amount).toBe(73500);
    expect(res.body.data.currency).toBe('INR');
    expect(res.body.data.keyId).toBeDefined();
    expect(res.body.data.keySecret).toBeUndefined(); // NEVER expose secret

    // Verify Payment document saved in DB
    const payment = await Payment.findOne({ razorpayOrderId: res.body.data.razorpayOrderId });
    expect(payment).toBeDefined();
    expect(payment.status).toBe('created');
    expect(payment.amount).toBe(73500);
  });

  test('POST /api/payments/razorpay/verify - valid signature creates Order and decrements inventory', async () => {
    const { token, store, product } = await setupTestFixtures();

    // 1. Add to cart & create payment order
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 2 })
      .expect(200);

    const orderRes = await request(app)
      .post('/api/payments/razorpay/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fulfillmentType: 'delivery',
        storeId: store._id,
        address: { street: 'Flat 101, Green Heights', city: 'Mumbai', state: 'MH', pincode: '400053' },
      })
      .expect(200);

    const razorpayOrderId = orderRes.body.data.razorpayOrderId;
    const razorpayPaymentId = `pay_${Date.now()}_test`;
    const razorpaySignature = generateSignature(razorpayOrderId, razorpayPaymentId);

    // Initial stock is 20
    const initialProduct = await Product.findById(product._id);
    expect(initialProduct.stock).toBe(20);

    // 2. Submit valid payment signature
    const verifyRes = await request(app)
      .post('/api/payments/razorpay/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      })
      .expect(201);

    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data._id).toBeDefined();
    expect(verifyRes.body.data.paymentDetails.razorpayPaymentId).toBe(razorpayPaymentId);
    expect(verifyRes.body.data.paymentDetails.status).toBe('paid');

    // Verify stock was decremented from 20 to 18
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(18);

    // Verify Payment document status is 'paid'
    const payment = await Payment.findOne({ razorpayOrderId });
    expect(payment.status).toBe('paid');
    expect(payment.orderId.toString()).toBe(verifyRes.body.data._id.toString());
  });

  test('POST /api/payments/razorpay/verify - rejects tampered/invalid signature with 400 and creates NO order', async () => {
    const { token, store, product } = await setupTestFixtures();

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 })
      .expect(200);

    const orderRes = await request(app)
      .post('/api/payments/razorpay/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fulfillmentType: 'delivery',
        storeId: store._id,
        address: { street: 'Flat 101, Green Heights', city: 'Mumbai', state: 'MH', pincode: '400053' },
      })
      .expect(200);

    const razorpayOrderId = orderRes.body.data.razorpayOrderId;
    const razorpayPaymentId = `pay_${Date.now()}_fake`;
    const fakeSignature = 'tampered_invalid_signature_hex_code_12345';

    // Submit invalid signature
    const verifyRes = await request(app)
      .post('/api/payments/razorpay/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: fakeSignature,
      })
      .expect(400);

    expect(verifyRes.body.success).toBe(false);
    expect(verifyRes.body.message).toMatch(/invalid payment signature/i);

    // Verify NO Order created in database
    const orderCount = await Order.countDocuments();
    expect(orderCount).toBe(0);

    // Verify product stock is untouched (still 20)
    const currentProduct = await Product.findById(product._id);
    expect(currentProduct.stock).toBe(20);
  });

  test('POST /api/payments/razorpay/verify - rejects cross-user payment validation with 403 Forbidden', async () => {
    const { token, tokenTwo, store, product } = await setupTestFixtures();

    // Customer 1 initiates payment order
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 })
      .expect(200);

    const orderRes = await request(app)
      .post('/api/payments/razorpay/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fulfillmentType: 'delivery',
        storeId: store._id,
        address: { street: 'Customer 1 Address', city: 'Mumbai', state: 'MH', pincode: '400053' },
      })
      .expect(200);

    const razorpayOrderId = orderRes.body.data.razorpayOrderId;
    const razorpayPaymentId = `pay_${Date.now()}_test`;
    const signature = generateSignature(razorpayOrderId, razorpayPaymentId);

    // Customer 2 attempts to verify Customer 1's payment order
    const crossRes = await request(app)
      .post('/api/payments/razorpay/verify')
      .set('Authorization', `Bearer ${tokenTwo}`) // Different user!
      .send({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: signature,
      })
      .expect(403);

    expect(crossRes.body.success).toBe(false);
    expect(crossRes.body.message).toMatch(/not authorized/i);
  });

  test('Auto-Refund Scenario: If item sells out before payment verification, triggers auto-refund and creates NO order', async () => {
    const { token, store, product } = await setupTestFixtures();

    // Set stock to 2
    await Product.findByIdAndUpdate(product._id, { stock: 2 });

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 2 })
      .expect(200);

    const orderRes = await request(app)
      .post('/api/payments/razorpay/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fulfillmentType: 'delivery',
        storeId: store._id,
        address: { street: 'Test Address', city: 'Mumbai', state: 'MH', pincode: '400053' },
      })
      .expect(200);

    const razorpayOrderId = orderRes.body.data.razorpayOrderId;
    const razorpayPaymentId = `pay_race_${Date.now()}`;
    const signature = generateSignature(razorpayOrderId, razorpayPaymentId);

    // Simulate concurrent purchase: stock drops to 0 before verify is called
    await Product.findByIdAndUpdate(product._id, { stock: 0 });

    // Customer completes payment and submits signature
    const verifyRes = await request(app)
      .post('/api/payments/razorpay/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: signature,
      })
      .expect(409);

    expect(verifyRes.body.success).toBe(false);
    expect(verifyRes.body.error).toBe('PAYMENT_AUTO_REFUNDED');
    expect(verifyRes.body.message).toMatch(/insufficient stock|refund/i);

    // Verify Payment document is marked refunded_insufficient_stock
    const payment = await Payment.findOne({ razorpayOrderId });
    expect(payment.status).toBe('refunded_insufficient_stock');
    expect(payment.refundDetails.refundId).toBeDefined();

    // Verify NO Order created
    const orderCount = await Order.countDocuments();
    expect(orderCount).toBe(0);
  });

  test('Explicit Idempotency: Duplicate verify calls for same payment create exactly ONE order and decrement stock once', async () => {
    const { token, store, product } = await setupTestFixtures();

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 3 })
      .expect(200);

    const orderRes = await request(app)
      .post('/api/payments/razorpay/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fulfillmentType: 'delivery',
        storeId: store._id,
        address: { street: 'Test Address', city: 'Mumbai', state: 'MH', pincode: '400053' },
      })
      .expect(200);

    const razorpayOrderId = orderRes.body.data.razorpayOrderId;
    const razorpayPaymentId = `pay_idempotent_${Date.now()}`;
    const signature = generateSignature(razorpayOrderId, razorpayPaymentId);

    // First verify call
    const res1 = await request(app)
      .post('/api/payments/razorpay/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: signature,
      })
      .expect(201);

    // Second verify call (e.g. user retrying or network retry)
    const res2 = await request(app)
      .post('/api/payments/razorpay/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: signature,
      })
      .expect(201);

    // Assert only ONE order exists in database
    const orders = await Order.find();
    expect(orders.length).toBe(1);
    expect(res1.body.data._id).toBe(res2.body.data._id);

    // Assert inventory was decremented only once (from 20 by 3 -> 17)
    const currentProduct = await Product.findById(product._id);
    expect(currentProduct.stock).toBe(17);
  });

  test('POST /api/payments/razorpay/webhook - processes server-to-server payment.captured event', async () => {
    const { token, store, product } = await setupTestFixtures();

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 })
      .expect(200);

    const orderRes = await request(app)
      .post('/api/payments/razorpay/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fulfillmentType: 'delivery',
        storeId: store._id,
        address: { street: 'Webhook Address', city: 'Mumbai', state: 'MH', pincode: '400053' },
      })
      .expect(200);

    const razorpayOrderId = orderRes.body.data.razorpayOrderId;
    const razorpayPaymentId = `pay_hook_${Date.now()}`;

    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: razorpayPaymentId,
            order_id: razorpayOrderId,
            amount: 36750,
            status: 'captured',
          },
        },
      },
    };

    const rawBody = JSON.stringify(webhookPayload);
    const webhookSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const hookRes = await request(app)
      .post('/api/payments/razorpay/webhook')
      .set('x-razorpay-signature', webhookSignature)
      .set('Content-Type', 'application/json')
      .send(rawBody)
      .expect(200);

    expect(hookRes.body.status).toBe('ok');

    // Assert order was created via webhook
    const order = await Order.findOne({ 'paymentDetails.razorpayOrderId': razorpayOrderId });
    expect(order).toBeDefined();
    expect(order.paymentDetails.razorpayPaymentId).toBe(razorpayPaymentId);
  });

  test('POST /api/returns/:id/refund - Store Manager can issue automated Razorpay refund for approved return', async () => {
    const { customer, managerToken, store, product } = await setupTestFixtures();

    // 1. Create a completed order with payment details
    const order = await Order.create({
      userId: customer._id,
      items: [{ productId: product._id, qty: 1, priceAtOrder: 350.0 }],
      status: 'completed',
      fulfillmentType: 'delivery',
      storeId: store._id,
      subtotal: 350.0,
      taxAmount: 17.5,
      deliveryFee: 30.0,
      totalAmount: 397.5,
      paymentDetails: {
        razorpayOrderId: 'order_test_refund_123',
        razorpayPaymentId: 'pay_test_refund_456',
        status: 'paid',
      },
    });

    // 2. Create an approved ReturnRequest
    const returnReq = await ReturnRequest.create({
      orderId: order._id,
      itemId: product._id,
      type: 'return',
      reason: 'Product defective',
      status: 'approved',
    });

    // 3. Store manager executes refund
    const refundRes = await request(app)
      .post(`/api/returns/${returnReq._id}/refund`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(refundRes.body.success).toBe(true);
    expect(refundRes.body.data.refund.id).toBeDefined();
    expect(refundRes.body.data.request.status).toBe('completed');

    // Verify return request in DB is marked completed
    const updatedReq = await ReturnRequest.findById(returnReq._id);
    expect(updatedReq.status).toBe('completed');
  });

  test('POST /api/payments/razorpay/verify - safely returns 400 for malformed/short signatures without throwing 500', async () => {
    const { token, store, product } = await setupTestFixtures();

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 })
      .expect(200);

    const orderRes = await request(app)
      .post('/api/payments/razorpay/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fulfillmentType: 'delivery',
        storeId: store._id,
        address: { street: 'Test Address', city: 'Mumbai', state: 'MH', pincode: '400053' },
      })
      .expect(200);

    // Mismatched length signatures (e.g. short string, empty string, odd length)
    const malformedSignatures = ['bad', 'short_sig', '12345', 'invalid_hex!@#$'];

    for (const badSig of malformedSignatures) {
      const res = await request(app)
        .post('/api/payments/razorpay/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          razorpay_order_id: orderRes.body.data.razorpayOrderId,
          razorpay_payment_id: 'pay_test_123',
          razorpay_signature: badSig,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid payment signature/i);
    }
  });

  test('POST /api/returns/:id/refund - strictly prevents double refunds on the same return request', async () => {
    const { customer, managerToken, store, product } = await setupTestFixtures();

    const order = await Order.create({
      userId: customer._id,
      items: [{ productId: product._id, qty: 1, priceAtOrder: 350.0 }],
      status: 'completed',
      fulfillmentType: 'delivery',
      storeId: store._id,
      subtotal: 350.0,
      taxAmount: 17.5,
      deliveryFee: 30.0,
      totalAmount: 397.5,
      paymentDetails: {
        razorpayOrderId: 'order_test_dup_refund',
        razorpayPaymentId: 'pay_test_dup_refund',
        status: 'paid',
      },
    });

    const returnReq = await ReturnRequest.create({
      orderId: order._id,
      itemId: product._id,
      type: 'return',
      reason: 'Wrong size',
      status: 'approved',
    });

    // 1. First refund call succeeds
    const res1 = await request(app)
      .post(`/api/returns/${returnReq._id}/refund`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(res1.body.success).toBe(true);
    expect(res1.body.data.request.status).toBe('completed');

    // 2. Second refund call on the SAME return request is rejected
    const res2 = await request(app)
      .post(`/api/returns/${returnReq._id}/refund`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(400);

    expect(res2.body.success).toBe(false);
    expect(res2.body.message).toMatch(/already been refunded|must be "approved"/i);
  });
});
