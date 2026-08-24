import ReturnEligibilityService from '../src/services/returnEligibilityService.js';
import Order from '../src/models/Order.js';
import Product from '../src/models/Product.js';
import Store from '../src/models/Store.js';
import Category from '../src/models/Category.js';
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

const defaultStoreAddress = {
  street: '123 Market St',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

describe('Return & Exchange Eligibility Tests', () => {
  test('Rejects return request when order is not yet completed', async () => {
    const userId = new mongoose.Types.ObjectId();
    const store = await Store.create({ name: 'S1', address: defaultStoreAddress, geo: { type: 'Point', coordinates: [72.8, 19.0] } });
    const cat = await Category.create({ name: 'C1' });
    const product = await Product.create({ name: 'P1', categoryId: cat._id, price: 50, stock: 10, unit: '1 pc', storeId: store._id, isReturnable: true });

    const order = await Order.create({
      userId,
      items: [{ productId: product._id, qty: 1, priceAtOrder: 50 }],
      status: 'preparing', // Not completed
      fulfillmentType: 'pickup',
      storeId: store._id,
      totalAmount: 52.5,
    });

    const res = await ReturnEligibilityService.checkItemEligibility(order._id, product._id, userId);
    expect(res.isEligible).toBe(false);
    expect(res.reason).toMatch(/Order is not completed yet/i);
  });

  test('Rejects return request for non-returnable products', async () => {
    const userId = new mongoose.Types.ObjectId();
    const store = await Store.create({ name: 'S1', address: defaultStoreAddress, geo: { type: 'Point', coordinates: [72.8, 19.0] } });
    const cat = await Category.create({ name: 'C1' });
    const product = await Product.create({ name: 'Milk Pack', categoryId: cat._id, price: 30, stock: 10, unit: '1L', storeId: store._id, isReturnable: false });

    const order = await Order.create({
      userId,
      items: [{ productId: product._id, qty: 1, priceAtOrder: 30 }],
      status: 'completed',
      fulfillmentType: 'delivery',
      storeId: store._id,
      totalAmount: 31.5,
      statusHistory: [{ status: 'completed', timestamp: new Date() }],
    });

    const res = await ReturnEligibilityService.checkItemEligibility(order._id, product._id, userId);
    expect(res.isEligible).toBe(false);
    expect(res.reason).toMatch(/non-returnable/i);
  });

  test('Rejects return request when return window has expired', async () => {
    const userId = new mongoose.Types.ObjectId();
    const store = await Store.create({ name: 'S1', address: defaultStoreAddress, geo: { type: 'Point', coordinates: [72.8, 19.0] } });
    const cat = await Category.create({ name: 'C1' });
    const product = await Product.create({
      name: 'Electronic Item',
      categoryId: cat._id,
      price: 500,
      stock: 10,
      unit: '1 pc',
      storeId: store._id,
      isReturnable: true,
      returnWindowHours: 24, // 24 hours window
    });

    // Completed 48 hours ago
    const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const order = await Order.create({
      userId,
      items: [{ productId: product._id, qty: 1, priceAtOrder: 500 }],
      status: 'completed',
      fulfillmentType: 'delivery',
      storeId: store._id,
      totalAmount: 525,
      statusHistory: [{ status: 'completed', timestamp: pastDate }],
    });

    const res = await ReturnEligibilityService.checkItemEligibility(order._id, product._id, userId);
    expect(res.isEligible).toBe(false);
    expect(res.reason).toMatch(/Return window expired/i);
  });
});
