import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
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

const createTestUserWithToken = async (role) => {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const user = await User.create({
    name: `${role} User`,
    email: `${role}@example.com`,
    passwordHash,
    role,
    isActive: true,
  });

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_mini_dmart_change_in_production';
  const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '1h' });
  return { user, token };
};

describe('Role-Based Access Control (RBAC) Tests', () => {
  test('Store Staff is blocked from accessing Admin endpoints with 403 Forbidden', async () => {
    const { token } = await createTestUserWithToken('store_staff');

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  test('Customer is blocked from creating a Store with 403 Forbidden', async () => {
    const { token } = await createTestUserWithToken('customer');

    const res = await request(app)
      .post('/api/stores')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Illegal Store',
        address: { street: 'Main Road', city: 'Mumbai' },
      })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  test('Administrator can successfully access Admin endpoints', async () => {
    const { token } = await createTestUserWithToken('admin');

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.users).toBeDefined();
  });
});
