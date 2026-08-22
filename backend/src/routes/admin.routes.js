import { Router } from 'express';
import {
  getAdminOverview,
  getUsers,
  createUser,
  updateUser,
  getAuditLogs,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const adminRouter = Router();

// Strictly restricted to admin role
adminRouter.use(authenticate, requireRole('admin'));

adminRouter.get('/overview', getAdminOverview);
adminRouter.get('/users', getUsers);
adminRouter.post('/users', createUser);
adminRouter.patch('/users/:id', updateUser);
adminRouter.get('/audit-logs', getAuditLogs);

export default adminRouter;
