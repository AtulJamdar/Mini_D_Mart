import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Store from '../src/models/Store.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

const setupTestData = async () => {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const user = await User.create({
    name: 'Customer One',
    email: 'customer@example.com',
    passwordHash,
    role: 'customer',
  });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_mini_dmart_change_in_production',
    { expiresIn: '1h' }
  );

  const store = await Store.create({
    name: 'Test Supermarket',
    address: { street: '1st Ave', city: 'Mumbai', state: 'MH', pincode: '400001' },
    geo: { type: 'Point', coordinates: [72.8, 19.0] },
  });

  const category = await Category.create({ name: 'Snacks' });

  const product = await Product.create({
    name: 'Limited Edition Biscuits',
    categoryId: category._id,
    price: 50.0,
    stock: 5, // Only 5 available in stock
    unit: '1 pack',
    storeId: store._id,
  });

  return { user, token, store, category, product };
};

describe('Stock Validation & Inventory Guard Tests', () => {
  test('POST /api/cart/items - rejects adding quantity exceeding available stock', async () => {
    const { token, product } = await setupTestData();

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 10 }) // Requested 10, stock is 5
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/available stock is 5/i);
  });

  test('POST /api/orders/checkout - rejects order creation if inventory drops before checkout', async () => {
    const { token, product, store } = await setupTestData();

    // 1. Add valid quantity (4 units) to cart
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 4 })
      .expect(200);

    // 2. Simulate concurrent inventory depletion (stock drops to 2)
    await Product.findByIdAndUpdate(product._id, { stock: 2 });

    // 3. Attempt checkout -> must be rejected
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fulfillmentType: 'delivery',
        storeId: store._id,
        address: { street: '12 Green Road', city: 'Mumbai', state: 'MH', pincode: '400001' },
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/insufficient stock/i);
  });
});
