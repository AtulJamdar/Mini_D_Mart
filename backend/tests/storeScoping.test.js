import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Store from '../src/models/Store.js';
import Order from '../src/models/Order.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import ReturnRequest from '../src/models/ReturnRequest.js';
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

const createAuthToken = (user) => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_mini_dmart_change_in_production';
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '1h' });
};

describe('Multi-Store Data Isolation & Security Scoping Tests', () => {
  let storeA, storeB;
  let staffA, staffB, managerA, managerB, adminUser;
  let tokenStaffA, tokenStaffB, tokenManagerA, tokenManagerB, tokenAdmin;
  let productA, productB;
  let orderA, orderB;
  let returnA, returnB;

  beforeEach(async () => {
    // 1. Create two distinct Store branches
    storeA = await Store.create({
      name: 'Mini D-Mart Store Alpha',
      address: { street: 'Alpha Road', city: 'Mumbai', state: 'MH', pincode: '400001' },
      geo: { type: 'Point', coordinates: [72.8, 19.0] },
      isActive: true,
    });

    storeB = await Store.create({
      name: 'Mini D-Mart Store Beta',
      address: { street: 'Beta Boulevard', city: 'Pune', state: 'MH', pincode: '411001' },
      geo: { type: 'Point', coordinates: [73.8, 18.5] },
      isActive: true,
    });

    // 2. Create Staff and Managers assigned to Store A and Store B
    staffA = await User.create({
      name: 'Staff Alpha',
      email: 'staff.alpha@minidmart.com',
      role: 'store_staff',
      assignedStoreId: storeA._id,
      isActive: true,
    });
    tokenStaffA = createAuthToken(staffA);

    staffB = await User.create({
      name: 'Staff Beta',
      email: 'staff.beta@minidmart.com',
      role: 'store_staff',
      assignedStoreId: storeB._id,
      isActive: true,
    });
    tokenStaffB = createAuthToken(staffB);

    managerA = await User.create({
      name: 'Manager Alpha',
      email: 'manager.alpha@minidmart.com',
      role: 'store_manager',
      assignedStoreId: storeA._id,
      isActive: true,
    });
    tokenManagerA = createAuthToken(managerA);

    managerB = await User.create({
      name: 'Manager Beta',
      email: 'manager.beta@minidmart.com',
      role: 'store_manager',
      assignedStoreId: storeB._id,
      isActive: true,
    });
    tokenManagerB = createAuthToken(managerB);

    adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin.global@minidmart.com',
      role: 'admin',
      isActive: true,
    });
    tokenAdmin = createAuthToken(adminUser);

    // 3. Create sample Products for Store A and Store B
    const category = await Category.create({ name: 'General Grocery' });

    productA = await Product.create({
      name: 'Store A Product Item',
      categoryId: category._id,
      price: 50,
      stock: 30,
      unit: '1 pc',
      storeId: storeA._id,
    });

    productB = await Product.create({
      name: 'Store B Product Item',
      categoryId: category._id,
      price: 80,
      stock: 40,
      unit: '1 pc',
      storeId: storeB._id,
    });

    // 4. Create sample Orders for Store A and Store B
    const customerUser = await User.create({
      name: 'Customer One',
      email: 'customer.one@example.com',
      role: 'customer',
      isActive: true,
    });

    orderA = await Order.create({
      userId: customerUser._id,
      storeId: storeA._id,
      fulfillmentType: 'pickup',
      items: [{ productId: productA._id, qty: 1, priceAtOrder: 50 }],
      totalAmount: 50,
      status: 'placed',
      statusHistory: [{ status: 'placed', timestamp: new Date() }],
    });

    orderB = await Order.create({
      userId: customerUser._id,
      storeId: storeB._id,
      fulfillmentType: 'pickup',
      items: [{ productId: productB._id, qty: 1, priceAtOrder: 80 }],
      totalAmount: 80,
      status: 'placed',
      statusHistory: [{ status: 'placed', timestamp: new Date() }],
    });

    // 5. Create Return Requests for Store A and Store B
    returnA = await ReturnRequest.create({
      orderId: orderA._id,
      itemId: productA._id,
      type: 'return',
      reason: 'Defective packaging',
      status: 'requested',
    });

    returnB = await ReturnRequest.create({
      orderId: orderB._id,
      itemId: productB._id,
      type: 'return',
      reason: 'Expired item',
      status: 'requested',
    });
  });

  describe('Order Queue Scoping (GET /api/orders)', () => {
    test('Store-A staff hitting GET /api/orders only receives Store-A orders, even when passing storeId=Store-B in query', async () => {
      const res = await request(app)
        .get(`/api/orders?storeId=${storeB._id}`)
        .set('Authorization', `Bearer ${tokenStaffA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const orders = res.body.data.orders;
      expect(orders.length).toBe(1);
      expect(orders[0]._id.toString()).toBe(orderA._id.toString());
      expect(orders.some((o) => o._id.toString() === orderB._id.toString())).toBe(false);
    });

    test('Store-A staff hitting GET /api/orders/:id for Store-B order is rejected with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/orders/${orderB._id}`)
        .set('Authorization', `Bearer ${tokenStaffA}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/permission to view orders from another store/i);
    });

    test('Store-A staff hitting PATCH /api/orders/:id/status for Store-B order is rejected with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderB._id}/status`)
        .set('Authorization', `Bearer ${tokenStaffA}`)
        .send({ status: 'confirmed' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot modify orders for another store/i);
    });

    test('Global Admin can access any store queue or filter by specific storeId', async () => {
      const resA = await request(app)
        .get(`/api/orders?storeId=${storeA._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(resA.body.data.orders.length).toBe(1);
      expect(resA.body.data.orders[0]._id.toString()).toBe(orderA._id.toString());

      const resB = await request(app)
        .get(`/api/orders?storeId=${storeB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(resB.body.data.orders.length).toBe(1);
      expect(resB.body.data.orders[0]._id.toString()).toBe(orderB._id.toString());
    });
  });

  describe('Returns Queue Scoping (GET /api/returns)', () => {
    test('Store-A staff hitting GET /api/returns only receives Store-A returns', async () => {
      const res = await request(app)
        .get(`/api/returns?storeId=${storeB._id}`)
        .set('Authorization', `Bearer ${tokenStaffA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const returns = res.body.data;
      expect(returns.length).toBe(1);
      expect(returns[0]._id.toString()).toBe(returnA._id.toString());
      expect(returns.some((r) => r._id.toString() === returnB._id.toString())).toBe(false);
    });

    test('Store-B staff hitting GET /api/returns only receives Store-B returns', async () => {
      const res = await request(app)
        .get('/api/returns')
        .set('Authorization', `Bearer ${tokenStaffB}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const returns = res.body.data;
      expect(returns.length).toBe(1);
      expect(returns[0]._id.toString()).toBe(returnB._id.toString());
      expect(returns.some((r) => r._id.toString() === returnA._id.toString())).toBe(false);
    });
  });

  describe('Inventory Stock Editing Scoping (PATCH /api/products/:id/stock)', () => {
    test('Store-A manager can successfully update stock for Store-A product', async () => {
      const res = await request(app)
        .patch(`/api/products/${productA._id}/stock`)
        .set('Authorization', `Bearer ${tokenManagerA}`)
        .send({ stock: 55 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.stock).toBe(55);
    });

    test('Store-A manager attempting to update stock for Store-B product is rejected with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/products/${productB._id}/stock`)
        .set('Authorization', `Bearer ${tokenManagerA}`)
        .send({ stock: 99 })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/can only update inventory for your assigned store/i);
    });

    test('Admin can update stock for ANY store product (Store A and Store B)', async () => {
      // Admin updating Store-A product
      const resA = await request(app)
        .patch(`/api/products/${productA._id}/stock`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ stock: 75 })
        .expect(200);

      expect(resA.body.success).toBe(true);
      expect(resA.body.data.stock).toBe(75);

      // Admin updating Store-B product
      const resB = await request(app)
        .patch(`/api/products/${productB._id}/stock`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ stock: 85 })
        .expect(200);

      expect(resB.body.success).toBe(true);
      expect(resB.body.data.stock).toBe(85);
    });
  });

  describe('Stores Endpoint Scoping (GET /api/stores)', () => {
    test('GET /api/stores returns active stores by default, and includes all stores with ?all=true', async () => {
      // Create an inactive store
      const inactiveStore = await Store.create({
        name: 'Store Inactive Branch',
        address: { street: 'Closed Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400099' },
        geo: { type: 'Point', coordinates: [72.8777, 19.076] },
        isActive: false,
      });

      // Default (used by customers/checkout) - only active stores
      const resActiveOnly = await request(app).get('/api/stores').expect(200);
      expect(resActiveOnly.body.success).toBe(true);
      expect(resActiveOnly.body.data.some((s) => s._id.toString() === inactiveStore._id.toString())).toBe(false);

      // Admin ?all=true query - returns all stores including inactive
      const resAll = await request(app).get('/api/stores?all=true').expect(200);
      expect(resAll.body.success).toBe(true);
      expect(resAll.body.data.some((s) => s._id.toString() === inactiveStore._id.toString())).toBe(true);
    });
  });

  describe('Store Analytics Scoping (GET /api/stores/:storeId/analytics)', () => {
    test('Store-A manager attempting to view Store-B analytics is rejected with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/stores/${storeB._id}/analytics`)
        .set('Authorization', `Bearer ${tokenManagerA}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/can only view analytics for your assigned store/i);
    });

    test('Store-A manager can view Store-A analytics successfully', async () => {
      const res = await request(app)
        .get(`/api/stores/${storeA._id}/analytics`)
        .set('Authorization', `Bearer ${tokenManagerA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.todaySales).toBeDefined();
    });
  });
});
