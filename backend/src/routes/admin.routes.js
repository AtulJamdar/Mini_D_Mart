import { Router } from 'express';
import {
  getAdminOverview,
  getUsers,
  updateUser,
  getAuditLogs,
  getStaff,
  createStaff,
  updateStaff,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const adminRouter = Router();

// Strictly restricted to admin role
adminRouter.use(authenticate, requireRole('admin'));

adminRouter.get('/overview', getAdminOverview);
adminRouter.get('/users', getUsers);
adminRouter.patch('/users/:id', updateUser);
adminRouter.get('/audit-logs', getAuditLogs);

// Staff management
adminRouter.get('/staff', getStaff);
adminRouter.post('/staff', createStaff);
adminRouter.patch('/staff/:id', updateStaff);

export default adminRouter;
