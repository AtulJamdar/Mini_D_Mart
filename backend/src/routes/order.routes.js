import { Router } from 'express';
import {
  checkout,
  getOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const orderRouter = Router();

// All order operations require authentication
orderRouter.use(authenticate);

orderRouter.post('/checkout', checkout);
orderRouter.get('/', getOrders);
orderRouter.get('/my-orders', getOrders); // Backward-compatible alias
orderRouter.get('/:id', getOrderById);
orderRouter.patch('/:id/cancel', cancelOrder);
orderRouter.patch(
  '/:id/status',
  requireRole('store_staff', 'store_manager', 'admin'),
  updateOrderStatus
);

export default orderRouter;
