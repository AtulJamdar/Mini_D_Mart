import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Store from '../models/Store.js';
import AuditLoggerService from '../services/auditLogger.service.js';
import emailService from '../services/emailService.js';
import { generateSecurePassword } from '../utils/authHelper.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const BCRYPT_ROUNDS = 12;

/**
 * List staff members with role, store, and search filter
 * GET /api/admin/staff
 */
export const getStaff = async (req, res) => {
  try {
    const { role, storeId, store, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (role) {
      filter.role = role;
    } else {
      filter.role = { $in: ['store_staff', 'store_manager'] };
    }

    const targetStore = storeId || store;
    if (targetStore) {
      filter.assignedStoreId = targetStore;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [staff, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .populate('assignedStoreId', 'name code address city state')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        staff,
        pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 },
      },
      message: 'Staff members retrieved',
    });
  } catch (error) {
    return sendError(res, { statusCode: 500, message: 'Failed to retrieve staff members', error: error.message });
  }
};

/**
 * Create a staff / store manager account (Admin only)
 * POST /api/admin/staff
 * Body: { firstName, lastName, email, role (store_staff | store_manager), storeId, password? }
 */
export const createStaff = async (req, res) => {
  try {
    const { firstName, lastName, name, email, role, storeId, assignedStoreId, password } = req.body;

    const staffName = (name || [firstName, lastName].filter(Boolean).join(' ')).trim();
    if (!staffName) {
      return sendError(res, { statusCode: 400, message: 'First name or full name is required.' });
    }

    if (!email) {
      return sendError(res, { statusCode: 400, message: 'Email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Staff role must be store_staff or store_manager
    const targetRole = role || 'store_staff';
    if (!['store_staff', 'store_manager'].includes(targetRole)) {
      return sendError(res, {
        statusCode: 400,
        message: 'Invalid staff role. Role must be either "store_staff" or "store_manager".',
      });
    }

    const targetStoreId = storeId || assignedStoreId;
    let store = null;
    if (targetStoreId) {
      store = await Store.findById(targetStoreId);
      if (!store) {
        return sendError(res, { statusCode: 404, message: 'Assigned store not found.' });
      }
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return sendError(res, { statusCode: 409, message: 'A user with this email already exists.' });
    }

    // Use provided password or generate secure random one
    const plainPassword = (password && password.trim().length > 0)
      ? password.trim()
      : generateSecurePassword(12);

    const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

    const staffUser = await User.create({
      name: staffName,
      email: normalizedEmail,
      passwordHash,
      role: targetRole,
      assignedStoreId: store ? store._id : undefined,
      isActive: true,
      mustChangePassword: true,
      emailVerified: true,
    });

    // Send invitation email with temporary password & login URL
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    await emailService.sendStaffInviteEmail({
      email: staffUser.email,
      name: staffUser.name,
      role: staffUser.role,
      storeName: store ? store.name : '',
      loginUrl,
      tempPassword: plainPassword,
    });

    // Audit log staff creation (do NOT include plain-text credentials in log)
    await AuditLoggerService.logEvent({
      userId: req.user._id,
      action: 'ADMIN_CREATE_STAFF',
      resource: 'USER',
      resourceId: staffUser._id,
      metadata: {
        email: staffUser.email,
        name: staffUser.name,
        role: staffUser.role,
        assignedStoreId: staffUser.assignedStoreId,
        storeName: store ? store.name : 'Unassigned',
        createdBy: req.user.email,
      },
    });

    const populatedStaff = await User.findById(staffUser._id)
      .select('-passwordHash')
      .populate('assignedStoreId', 'name code address city state');

    return sendSuccess(res, {
      statusCode: 201,
      data: populatedStaff,
      message: `Staff account for "${staffUser.name}" (${staffUser.role}) created successfully and invitation email dispatched.`,
    });
  } catch (error) {
    return sendError(res, { statusCode: 400, message: error.message || 'Failed to create staff member' });
  }
};

/**
 * Update staff role, active status, store assignment, or password reset flag
 * PATCH /api/admin/staff/:id
 */
export const updateStaff = async (req, res) => {
  try {
    const { role, isActive, storeId, assignedStoreId, mustChangePassword } = req.body;
    const updates = {};

    if (role) {
      if (!['store_staff', 'store_manager', 'admin'].includes(role)) {
        return sendError(res, { statusCode: 400, message: 'Invalid role assignment.' });
      }
      updates.role = role;
    }

    if (typeof isActive === 'boolean') {
      updates.isActive = isActive;
    }

    if (typeof mustChangePassword === 'boolean') {
      updates.mustChangePassword = mustChangePassword;
    }

    const targetStore = storeId !== undefined ? storeId : assignedStoreId;
    if (targetStore !== undefined) {
      if (targetStore && targetStore !== '') {
        const storeExists = await Store.findById(targetStore);
        if (!storeExists) {
          return sendError(res, { statusCode: 404, message: 'Assigned store not found.' });
        }
        updates.assignedStoreId = targetStore;
      } else {
        updates.assignedStoreId = null;
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' })
      .select('-passwordHash')
      .populate('assignedStoreId', 'name code address city state');

    if (!user) {
      return sendError(res, { statusCode: 404, message: 'Staff member not found.' });
    }

    await AuditLoggerService.logEvent({
      userId: req.user._id,
      action: 'ADMIN_UPDATE_STAFF',
      resource: 'USER',
      resourceId: user._id,
      metadata: { updates, updatedStaffEmail: user.email },
    });

    return sendSuccess(res, {
      statusCode: 200,
      data: user,
      message: `Staff member "${user.name}" updated successfully.`,
    });
  } catch (error) {
    return sendError(res, { statusCode: 400, message: error.message || 'Failed to update staff member' });
  }
};

export default {
  getStaff,
  createStaff,
  updateStaff,
};
