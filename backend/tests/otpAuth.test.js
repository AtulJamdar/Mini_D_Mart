import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { User, Otp } from '../src/models/index.js';
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

describe('Phone + OTP Authentication Tests', () => {
  const testPhone = '9876543210';
  const rawOtp = '123456';

  test('POST /api/auth/otp/request - rejects invalid phone numbers', async () => {
    const res = await request(app)
      .post('/api/auth/otp/request')
      .send({ phone: '123' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/otp/request - generates OTP for new phone and returns isNewUser: true', async () => {
    const res = await request(app)
      .post('/api/auth/otp/request')
      .send({ phone: testPhone })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe(testPhone);
    expect(res.body.data.isNewUser).toBe(true);

    const savedOtp = await Otp.findOne({ phone: testPhone });
    expect(savedOtp).toBeDefined();
    expect(savedOtp.attempts).toBe(0);
  });

  test('POST /api/auth/otp/request - returns isNewUser: false when phone exists in DB', async () => {
    // Create an existing user
    await User.create({
      name: 'Existing Customer',
      phone: testPhone,
      role: 'customer',
      isActive: true,
    });

    const res = await request(app)
      .post('/api/auth/otp/request')
      .send({ phone: testPhone })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe(testPhone);
    expect(res.body.data.isNewUser).toBe(false);
  });

  test('POST /api/auth/otp/verify - creates new customer and returns JWT + user on valid OTP', async () => {
    const otpHash = await bcrypt.hash(rawOtp, 10);
    await Otp.create({
      phone: testPhone,
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        phone: testPhone,
        otp: rawOtp,
        firstName: 'Rahul',
        lastName: 'Sharma',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Rahul Sharma');
    expect(res.body.data.user.phone).toBe(testPhone);
    expect(res.body.data.user.role).toBe('customer');

    // Cookie check
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=/);
    expect(cookies[0]).toMatch(/HttpOnly/i);

    // Verify OTP record was deleted after successful verification
    const otpAfter = await Otp.findOne({ phone: testPhone });
    expect(otpAfter).toBeNull();

    // Verify User record in DB
    const userInDb = await User.findOne({ phone: testPhone });
    expect(userInDb).toBeDefined();
    expect(userInDb.name).toBe('Rahul Sharma');
    expect(userInDb.role).toBe('customer');
  });

  test('POST /api/auth/otp/verify - logs in existing customer on valid OTP', async () => {
    const existingUser = await User.create({
      name: 'Priya Patel',
      phone: testPhone,
      role: 'customer',
      isActive: true,
    });

    const otpHash = await bcrypt.hash(rawOtp, 10);
    await Otp.create({
      phone: testPhone,
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        phone: testPhone,
        otp: rawOtp,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user._id).toBe(existingUser._id.toString());
    expect(res.body.data.user.name).toBe('Priya Patel');
  });

  test('POST /api/auth/otp/verify - enforces max 5 attempts on wrong OTP', async () => {
    const otpHash = await bcrypt.hash(rawOtp, 10);
    await Otp.create({
      phone: testPhone,
      otpHash,
      attempts: 4, // 4 attempts already made
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // 5th attempt with wrong OTP
    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        phone: testPhone,
        otp: '999999',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Maximum verification attempts exceeded/i);

    // Otp should now be deleted
    const otpDoc = await Otp.findOne({ phone: testPhone });
    expect(otpDoc).toBeNull();
  });

  test('Subsequent Request Flow: OTP login -> extract Set-Cookie -> separate GET /api/auth/me call succeeds', async () => {
    const user = await User.create({
      name: 'Ananya Deshmukh',
      phone: testPhone,
      role: 'customer',
      isActive: true,
    });

    const otpHash = await bcrypt.hash(rawOtp, 10);
    await Otp.create({
      phone: testPhone,
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Step 1: Verify OTP and extract cookie
    const loginRes = await request(app)
      .post('/api/auth/otp/verify')
      .send({ phone: testPhone, otp: rawOtp })
      .expect(200);

    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=/);

    // Step 2: Separate subsequent request passing the cookie
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user._id).toBe(user._id.toString());
    expect(meRes.body.data.user.name).toBe('Ananya Deshmukh');
  });

  test('Subsequent Request Flow: OTP login -> separate request using Bearer token succeeds', async () => {
    const user = await User.create({
      name: 'Vikram Joshi',
      phone: testPhone,
      role: 'customer',
      isActive: true,
    });

    const otpHash = await bcrypt.hash(rawOtp, 10);
    await Otp.create({
      phone: testPhone,
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Step 1: Verify OTP and extract token
    const loginRes = await request(app)
      .post('/api/auth/otp/verify')
      .send({ phone: testPhone, otp: rawOtp })
      .expect(200);

    const token = loginRes.body.data.token;
    expect(token).toBeDefined();

    // Step 2: Separate subsequent request passing Bearer header
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user._id).toBe(user._id.toString());
    expect(meRes.body.data.user.phone).toBe(testPhone);
  });
});
