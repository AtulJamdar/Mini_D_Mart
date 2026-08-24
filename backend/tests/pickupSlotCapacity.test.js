import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Store from '../src/models/Store.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import PickupSlot from '../src/models/PickupSlot.js';
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

describe('Pickup Slot Capacity Tests', () => {
  test('POST /api/orders/checkout - rejects booking when pickup slot is at full capacity', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const user = await User.create({ name: 'Bob', email: 'bob@example.com', passwordHash, role: 'customer' });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_mini_dmart_change_in_production',
      { expiresIn: '1h' }
    );

    const store = await Store.create({
      name: 'S1',
      address: { street: 'Main St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      geo: { type: 'Point', coordinates: [72.8, 19.0] },
    });
    const cat = await Category.create({ name: 'C1' });
    const product = await Product.create({
      name: 'P1',
      categoryId: cat._id,
      price: 50,
      stock: 20,
      unit: '1 pc',
      storeId: store._id,
    });

    // Full slot (bookedCount: 5, maxOrders: 5)
    const slot = await PickupSlot.create({
      storeId: store._id,
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 3600 * 1000),
      maxOrders: 5,
      bookedCount: 5,
    });

    // Add product to cart
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 1 })
      .expect(200);

    // Attempt checkout
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fulfillmentType: 'pickup',
        storeId: store._id,
        pickupSlotId: slot._id,
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/full/i);
  });
});
