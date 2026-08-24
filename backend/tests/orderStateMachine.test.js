import request from 'supertest';
import app from '../src/app.js';
import OrderService from '../src/services/orderService.js';
import Order from '../src/models/Order.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import Store from '../src/models/Store.js';
import User from '../src/models/User.js';
import jwt from 'jsonwebtoken';
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';
import mongoose from 'mongoose';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

const createStaffWithToken = async (storeId) => {
  const staff = await User.create({
    name: 'Counter Staff',
    email: `staff_${Date.now()}_${Math.random()}@example.com`,
    role: 'store_staff',
    assignedStoreId: storeId,
    isActive: true,
  });

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_mini_dmart_change_in_production';
  const token = jwt.sign({ id: staff._id, role: staff.role }, secret, { expiresIn: '1h' });
  return { staff, token };
};

const createTestOrder = async ({ status = 'placed', fulfillmentType = 'pickup' } = {}) => {
  const store = await Store.create({
    name: 'Order Test Store',
    address: { street: 'Main Rd', city: 'Mumbai', state: 'MH', pincode: '400001' },
    geo: { type: 'Point', coordinates: [72.8, 19.0] },
  });

  const cat = await Category.create({ name: 'Fresh Produce' });
  const product = await Product.create({
    name: 'Fresh Apples',
    categoryId: cat._id,
    price: 100,
    stock: 20,
    unit: '1kg',
    storeId: store._id,
  });

  const order = await Order.create({
    userId: new mongoose.Types.ObjectId(),
    items: [{ productId: product._id, qty: 2, priceAtOrder: 100 }],
    status,
    fulfillmentType,
    storeId: store._id,
    address: fulfillmentType === 'delivery' ? { street: '123 Marine Drive', city: 'Mumbai', state: 'Maharashtra', pincode: '400020' } : undefined,
    totalAmount: 210,
    statusHistory: [{ status, timestamp: new Date(), note: 'Initial placement' }],
  });

  return { order, product, store };
};

describe('Order State Machine & Transition Tests', () => {
  test('Full Pickup Lifecycle via PATCH /api/orders/:id/status: PLACED -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> COMPLETED', async () => {
    const { order, store } = await createTestOrder({ status: 'placed', fulfillmentType: 'pickup' });
    const { token } = await createStaffWithToken(store._id);

    // 1. Staff Action: "Confirm Order" (placed -> confirmed)
    const res1 = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'confirmed', note: 'Staff accepted & confirmed order' })
      .expect(200);

    expect(res1.body.success).toBe(true);
    expect(res1.body.data.status).toBe('confirmed');

    // 2. Staff Action: "Start Preparing" (confirmed -> preparing)
    const res2 = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'preparing', note: 'Staff picking items' })
      .expect(200);

    expect(res2.body.success).toBe(true);
    expect(res2.body.data.status).toBe('preparing');

    // 3. Staff Action: "Mark Ready" (preparing -> ready_for_pickup)
    const res3 = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ready_for_pickup', note: 'Bagged & ready at pickup counter' })
      .expect(200);

    expect(res3.body.success).toBe(true);
    expect(res3.body.data.status).toBe('ready_for_pickup');

    // 4. Staff Action: "Mark Picked Up" (ready_for_pickup -> completed)
    const res4 = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed', note: 'Customer collected package' })
      .expect(200);

    expect(res4.body.success).toBe(true);
    expect(res4.body.data.status).toBe('completed');
    expect(res4.body.data.statusHistory.length).toBe(5);
  });

  test('Full Delivery Lifecycle via PATCH /api/orders/:id/status: PLACED -> CONFIRMED -> PREPARING -> OUT_FOR_DELIVERY -> COMPLETED', async () => {
    const { order, store } = await createTestOrder({ status: 'placed', fulfillmentType: 'delivery' });
    const { token } = await createStaffWithToken(store._id);

    // 1. Staff Action: "Confirm Order" (placed -> confirmed)
    const res1 = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'confirmed' })
      .expect(200);
    expect(res1.body.data.status).toBe('confirmed');

    // 2. Staff Action: "Start Preparing" (confirmed -> preparing)
    const res2 = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'preparing' })
      .expect(200);
    expect(res2.body.data.status).toBe('preparing');

    // 3. Staff Action: "Dispatch for Delivery" (preparing -> out_for_delivery)
    const res3 = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'out_for_delivery', note: 'Handed to delivery rider' })
      .expect(200);
    expect(res3.body.data.status).toBe('out_for_delivery');

    // 4. Staff Action: "Mark Delivered" (out_for_delivery -> completed)
    const res4 = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed', note: 'Delivered to doorstep' })
      .expect(200);
    expect(res4.body.data.status).toBe('completed');
  });

  test('Rejects illegal status transition from PLACED directly to COMPLETED', async () => {
    const { order, store } = await createTestOrder({ status: 'placed' });
    const { token } = await createStaffWithToken(store._id);

    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid status transition/i);
  });

  test('Rejects cancellation once order is in PREPARING status', async () => {
    const { order } = await createTestOrder({ status: 'preparing' });

    await expect(
      OrderService.cancelOrder(order._id, order.userId)
    ).rejects.toThrow(/Order cannot be cancelled in "PREPARING" status/i);
  });
});
