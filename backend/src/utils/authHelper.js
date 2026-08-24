import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_mini_dmart_change_in_production';

/**
 * Generate JWT access token
 */
export const signToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Configure cookie options for JWT (7 days duration)
 */
export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  };
};

/**
 * Normalizes phone number to 10 digits
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.toString().replace(/\D/g, '').slice(-10);
};

/**
 * Helper to generate random N-digit numeric OTP
 */
export const generateOtp = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Generate a cryptographically secure random password (12 chars default, mixed case + digits + symbol)
 */
export const generateSecurePassword = (length = 12) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = lowercase + uppercase + digits + symbols;

  // Guarantee at least one character from each class
  const password = [
    lowercase[crypto.randomInt(0, lowercase.length)],
    uppercase[crypto.randomInt(0, uppercase.length)],
    digits[crypto.randomInt(0, digits.length)],
    symbols[crypto.randomInt(0, symbols.length)],
  ];

  for (let i = password.length; i < length; i++) {
    password.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  // Shuffle using Fisher-Yates with crypto.randomInt
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
};

/**
 * Clean user response payload formatter (omits sensitive fields)
 */
export const formatUserResponse = (user) => {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    emailVerified: user.emailVerified,
    assignedStoreId: user.assignedStoreId,
    preferredLocation: user.preferredLocation,
    addresses: user.addresses,
    createdAt: user.createdAt,
  };
};
