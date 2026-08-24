import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Store from '../src/models/Store.js';
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
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const user = await User.create({
    name: `${role} User`,
    email: `${role}@example.com`,
    passwordHash,
    role,
    isActive: true,
    emailVerified: true,
  });

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_mini_dmart_change_in_production';
  const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '1h' });
  return { user, token };
};

const createTestStore = async (name = 'Kothrud Supermarket') => {
  return await Store.create({
    name,
    address: {
      street: 'Paud Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
    },
    geo: {
      type: 'Point',
      coordinates: [73.8567, 18.5204],
    },
  });
};

describe('Admin Staff Management Tests', () => {
  test('POST /api/admin/staff - auto-generates secure password when omitted and sets mustChangePassword & emailVerified to true', async () => {
    const { token } = await createTestUserWithToken('admin');
    const store = await createTestStore();

    const res = await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Aarav',
        lastName: 'Sharma',
        email: 'aarav.sharma@example.com',
        role: 'store_staff',
        storeId: store._id,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe('Aarav Sharma');
    expect(res.body.data.email).toBe('aarav.sharma@example.com');
    expect(res.body.data.role).toBe('store_staff');
    expect(res.body.data.mustChangePassword).toBe(true);
    expect(res.body.data.emailVerified).toBe(true);
    expect(res.body.data.isActive).toBe(true);

    // CRITICAL: Ensure password & passwordHash are NEVER returned in API response
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.passwordHash).toBeUndefined();

    // Verify DB record
    const createdInDb = await User.findOne({ email: 'aarav.sharma@example.com' });
    expect(createdInDb).toBeDefined();
    expect(createdInDb.passwordHash).toBeDefined();
    expect(createdInDb.mustChangePassword).toBe(true);
    expect(createdInDb.emailVerified).toBe(true);
  });

  test('POST /api/admin/staff - accepts provided password and never exposes it in response', async () => {
    const { token } = await createTestUserWithToken('admin');
    const store = await createTestStore();

    const customPass = 'CustomSecureStaffPass123!';
    const res = await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Priya',
        lastName: 'Patil',
        email: 'priya.patil@example.com',
        role: 'store_manager',
        storeId: store._id,
        password: customPass,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Priya Patil');
    expect(res.body.data.role).toBe('store_manager');
    expect(res.body.data.password).toBeUndefined();

    // Verify user can login with the custom password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'priya.patil@example.com',
        password: customPass,
      })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.role).toBe('store_manager');
  });

  test('POST /api/admin/staff - rejects invalid staff roles and duplicate emails', async () => {
    const { token } = await createTestUserWithToken('admin');

    // 1. Invalid role
    const invalidRoleRes = await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Invalid',
        lastName: 'RoleUser',
        email: 'invalid.role@example.com',
        role: 'customer', // Not permitted for staff creation
      })
      .expect(400);

    expect(invalidRoleRes.body.success).toBe(false);

    // 2. Duplicate email
    await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'First',
        lastName: 'Staff',
        email: 'duplicate@example.com',
        role: 'store_staff',
      })
      .expect(201);

    const duplicateRes = await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Second',
        lastName: 'Staff',
        email: 'duplicate@example.com',
        role: 'store_manager',
      })
      .expect(409);

    expect(duplicateRes.body.success).toBe(false);
  });

  test('GET /api/admin/staff - lists staff and filters by role, store, and search', async () => {
    const { token } = await createTestUserWithToken('admin');
    const store1 = await createTestStore('Store 1');
    const store2 = await Store.create({
      name: 'Store 2',
      address: { street: 'Link Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
      geo: { type: 'Point', coordinates: [72.83, 19.13] },
    });

    // Create 1 manager at store 1
    await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Rohan', lastName: 'Manager', email: 'rohan.m@example.com', role: 'store_manager', storeId: store1._id });

    // Create 1 staff at store 1
    await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Amit', lastName: 'Staff', email: 'amit.s@example.com', role: 'store_staff', storeId: store1._id });

    // Create 1 staff at store 2
    await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Sneha', lastName: 'StoreTwo', email: 'sneha.s@example.com', role: 'store_staff', storeId: store2._id });

    // 1. Get all staff
    const allRes = await request(app)
      .get('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(allRes.body.data.staff.length).toBe(3);

    // 2. Filter by role=store_manager
    const managerRes = await request(app)
      .get('/api/admin/staff?role=store_manager')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(managerRes.body.data.staff.length).toBe(1);
    expect(managerRes.body.data.staff[0].name).toBe('Rohan Manager');

    // 3. Filter by storeId
    const store2Res = await request(app)
      .get(`/api/admin/staff?storeId=${store2._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(store2Res.body.data.staff.length).toBe(1);
    expect(store2Res.body.data.staff[0].name).toBe('Sneha StoreTwo');

    // 4. Search by name
    const searchRes = await request(app)
      .get('/api/admin/staff?search=Amit')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(searchRes.body.data.staff.length).toBe(1);
    expect(searchRes.body.data.staff[0].name).toBe('Amit Staff');
  });

  test('PATCH /api/admin/staff/:id - toggles active status and updates role/store', async () => {
    const { token } = await createTestUserWithToken('admin');
    const store1 = await createTestStore('Store 1');
    const store2 = await Store.create({
      name: 'Store 2',
      address: { street: 'Link Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
      geo: { type: 'Point', coordinates: [72.83, 19.13] },
    });

    const createRes = await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Vikas', lastName: 'K', email: 'vikas.k@example.com', role: 'store_staff', storeId: store1._id });

    const staffId = createRes.body.data._id;

    // 1. Deactivate staff member
    const deactRes = await request(app)
      .patch(`/api/admin/staff/${staffId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false })
      .expect(200);

    expect(deactRes.body.data.isActive).toBe(false);

    // 2. Reactivate and promote to store_manager at store2
    const updateRes = await request(app)
      .patch(`/api/admin/staff/${staffId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        isActive: true,
        role: 'store_manager',
        storeId: store2._id,
      })
      .expect(200);

    expect(updateRes.body.data.isActive).toBe(true);
    expect(updateRes.body.data.role).toBe('store_manager');
    expect(updateRes.body.data.assignedStoreId._id.toString()).toBe(store2._id.toString());
  });

  test('RBAC - Non-admin users are strictly blocked with 403 Forbidden', async () => {
    const { token: staffToken } = await createTestUserWithToken('store_staff');

    await request(app)
      .get('/api/admin/staff')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(403);

    await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ firstName: 'Hacker', lastName: 'Staff', email: 'hacker@example.com', role: 'store_staff' })
      .expect(403);
  });
});
