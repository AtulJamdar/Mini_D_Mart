import { Router } from 'express';
import {
  createReturn,
  checkEligibility,
  getReturns,
  approveReturn,
  rejectReturn,
  refundReturn,
} from '../controllers/return.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const returnRouter = Router();

// Protected routes
returnRouter.use(authenticate);

returnRouter.post('/', createReturn);
returnRouter.get('/', getReturns);
returnRouter.get('/eligibility/:orderId/:itemId', checkEligibility);

returnRouter.patch(
  '/:id/approve',
  requireRole('store_manager', 'admin'),
  approveReturn
);

returnRouter.patch(
  '/:id/reject',
  requireRole('store_manager', 'admin'),
  rejectReturn
);

returnRouter.post(
  '/:id/refund',
  requireRole('store_manager', 'admin'),
  refundReturn
);

export default returnRouter;
