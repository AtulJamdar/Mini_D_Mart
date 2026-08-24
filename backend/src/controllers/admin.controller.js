import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';
import AuditLoggerService from '../services/auditLogger.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const BCRYPT_ROUNDS = 12;

// Re-export staff controllers from modular adminStaff.controller.js
export { getStaff, createStaff, updateStaff } from './adminStaff.controller.js';

/**
 * Get system-wide overview KPI statistics
 * GET /api/admin/overview
 */
export const getAdminOverview = async (req, res) => {
  try {
    const [storeCount, productCount, userCount, staffCount, orders, auditCount] = await Promise.all([
      Store.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: { $in: ['store_staff', 'store_manager', 'admin'] } }),
      Order.find({ status: { $ne: 'cancelled' } }).select('totalAmount status'),
      AuditLog.countDocuments(),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        storeCount,
        productCount,
        customerCount: userCount,
        staffCount,
        totalOrders: orders.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        auditCount,
      },
      message: 'System overview retrieved',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to retrieve system overview',
      error: error.message,
    });
  }
};

/**
 * Get all users with role and search filter
 * GET /api/admin/users
 */
export const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .populate('assignedStoreId', 'name address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        users,
        pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 },
      },
      message: 'Users retrieved',
    });
  } catch (error) {
    return sendError(res, { statusCode: 500, message: 'Failed to retrieve users', error: error.message });
  }
};

/**
 * Update user role, active status, or store assignment
 * PATCH /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { role, isActive, assignedStoreId } = req.body;
    const updates = {};

    if (role) updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (assignedStoreId !== undefined) updates.assignedStoreId = assignedStoreId || null;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('-passwordHash')
      .populate('assignedStoreId', 'name address');

    if (!user) {
      return sendError(res, { statusCode: 404, message: 'User not found' });
    }

    await AuditLoggerService.logEvent({
      userId: req.user._id,
      action: 'ADMIN_UPDATE_USER',
      resource: 'USER',
      resourceId: user._id,
      metadata: { updates, updatedUserEmail: user.email },
    });

    return sendSuccess(res, { statusCode: 200, data: user, message: 'User updated successfully.' });
  } catch (error) {
    return sendError(res, { statusCode: 400, message: error.message || 'Failed to update user' });
  }
};

/**
 * Query Audit Logs (Filter by user/action/resource/date range)
 * GET /api/admin/audit-logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { userId, action, resource, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (resource) filter.resource = resource.toUpperCase();

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) filter.createdAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          // If to date is just date without time, set to end of day
          if (typeof to === 'string' && to.length === 10) {
            toDate.setHours(23, 59, 59, 999);
          }
          filter.createdAt.$lte = toDate;
        }
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        logs,
        pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 },
      },
      message: 'Audit logs retrieved',
    });
  } catch (error) {
    return sendError(res, { statusCode: 500, message: 'Failed to retrieve audit logs', error: error.message });
  }
};
