import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { signToken } from '../src/utils/authHelper.js';
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

describe('Authentication & User Address Management Tests', () => {
  const testUser = {
    name: 'Alice Smith',
    email: 'alice@example.com',
    password: 'Password123!',
    phone: '9876543210',
  };

  const seedUser = async () => {
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    return User.create({
      name: testUser.name,
      email: testUser.email,
      phone: testUser.phone,
      passwordHash,
      role: 'customer',
      isActive: true,
    });
  };

  test('POST /api/auth/register - is removed and returns 404 (No Public Role Selection)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - successfully logs in existing user with valid credentials', async () => {
    await seedUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.role).toBe('customer');

    // Verify httpOnly cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=/);
    expect(cookies[0]).toMatch(/HttpOnly/i);
  });

  test('POST /api/auth/login - rejects wrong password with generic error message', async () => {
    await seedUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword999' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  test('POST /api/auth/login - rejects non-existent email with identical generic error (No Email Leakage)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'Password123!' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  describe('Address Management (POST & DELETE /api/auth/addresses)', () => {
    test('POST /api/auth/addresses - rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/auth/addresses')
        .send({
          addressLine1: 'Flat 101, Test Tower',
          city: 'Mumbai',
          pincode: '400001',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('POST /api/auth/addresses - validates required fields, 6-digit PIN code, and phone format', async () => {
      const user = await seedUser();
      const token = signToken(user._id, user.role);

      // Missing line1 / city
      const resMissing = await request(app)
        .post('/api/auth/addresses')
        .set('Cookie', [`token=${token}`])
        .send({ city: 'Mumbai' })
        .expect(400);

      expect(resMissing.body.success).toBe(false);

      // Invalid PIN code (5 digits)
      const resPin = await request(app)
        .post('/api/auth/addresses')
        .set('Cookie', [`token=${token}`])
        .send({
          addressLine1: 'Flat 101, Test Tower',
          city: 'Mumbai',
          pincode: '12345',
        })
        .expect(400);

      expect(resPin.body.message).toMatch(/PIN code/i);

      // Invalid phone format
      const resPhone = await request(app)
        .post('/api/auth/addresses')
        .set('Cookie', [`token=${token}`])
        .send({
          addressLine1: 'Flat 101, Test Tower',
          city: 'Mumbai',
          pincode: '400001',
          phone: '12345',
        })
        .expect(400);

      expect(resPhone.body.message).toMatch(/Phone number/i);
    });

    test('POST /api/auth/addresses - successfully adds address and auto-sets isDefault for first address', async () => {
      const user = await seedUser();
      const token = signToken(user._id, user.role);

      const res = await request(app)
        .post('/api/auth/addresses')
        .set('Cookie', [`token=${token}`])
        .send({
          label: 'Home',
          addressLine1: 'Flat 402, Sunshine Heights',
          addressLine2: 'MG Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          phone: '9876543210',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.addresses).toHaveLength(1);
      expect(res.body.data.addresses[0].addressLine1).toBe('Flat 402, Sunshine Heights');
      expect(res.body.data.addresses[0].isDefault).toBe(true);
    });

    test('DELETE /api/auth/addresses/:id - prevents deleting default address when other addresses exist', async () => {
      const user = await seedUser();
      const token = signToken(user._id, user.role);

      // 1. Add Address 1 (Default)
      const res1 = await request(app)
        .post('/api/auth/addresses')
        .set('Cookie', [`token=${token}`])
        .send({
          label: 'Home',
          addressLine1: 'Flat 101, Tower A',
          city: 'Mumbai',
          pincode: '400001',
          isDefault: true,
        })
        .expect(201);

      const addr1Id = res1.body.data.addresses[0]._id;

      // 2. Add Address 2 (Non-default)
      const res2 = await request(app)
        .post('/api/auth/addresses')
        .set('Cookie', [`token=${token}`])
        .send({
          label: 'Office',
          addressLine1: 'Unit 502, Business Hub',
          city: 'Mumbai',
          pincode: '400051',
          isDefault: false,
        })
        .expect(201);

      const addr2Id = res2.body.data.addresses[1]._id;

      // 3. Attempt to delete Address 1 (which is default while Address 2 exists) -> must fail with 400
      const resDeleteDefault = await request(app)
        .delete(`/api/auth/addresses/${addr1Id}`)
        .set('Cookie', [`token=${token}`])
        .expect(400);

      expect(resDeleteDefault.body.success).toBe(false);
      expect(resDeleteDefault.body.message).toMatch(/cannot delete your default address/i);

      // 4. Delete Address 2 (non-default) -> must succeed
      const resDeleteNonDefault = await request(app)
        .delete(`/api/auth/addresses/${addr2Id}`)
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(resDeleteNonDefault.body.success).toBe(true);
      expect(resDeleteNonDefault.body.data.addresses).toHaveLength(1);

      // 5. Now delete the only remaining address -> must succeed (empty address book allowed)
      const resDeleteOnly = await request(app)
        .delete(`/api/auth/addresses/${addr1Id}`)
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(resDeleteOnly.body.success).toBe(true);
      expect(resDeleteOnly.body.data.addresses).toHaveLength(0);
    });
  });
});
