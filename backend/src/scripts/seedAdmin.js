import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const BCRYPT_ROUNDS = 12;

export const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if any admin user already exists (idempotency)
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`[Seed Admin] Admin user already exists (${existingAdmin.email}). Skipping seed.`);
      return;
    }

    const email = (process.env.ADMIN_SEED_EMAIL || 'admin@minidmart.com').toLowerCase().trim();
    const password = process.env.ADMIN_SEED_PASSWORD || 'Admin@123456';
    const firstName = (process.env.ADMIN_SEED_FIRST_NAME || 'System').trim();
    const lastName = (process.env.ADMIN_SEED_LAST_NAME || 'Admin').trim();
    const name = `${firstName} ${lastName}`.trim() || 'Admin User';

    // Check if a user with the target email already exists
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      console.log(`[Seed Admin] User with email ${email} already exists with role '${existingEmailUser.role}'. Skipping seed.`);
      return;
    }

    // Hash password with standard bcrypt rounds matching auth service
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const adminUser = await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      isActive: true,
    });

    console.log(`[Seed Admin] Admin user successfully created! (Email: ${adminUser.email}, Name: ${adminUser.name}, Role: ${adminUser.role})`);
  } catch (error) {
    console.error(`[Seed Admin Error] Failed to seed admin user: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[Seed Admin] Database connection closed.');
    }
  }
};

// Execute script
seedAdmin();
