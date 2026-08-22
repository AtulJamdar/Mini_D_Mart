import { Router } from 'express';
import {
  getProducts,
  updateProductStock,
  seedSampleData,
} from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const productRouter = Router();

// Public catalog viewing
productRouter.get('/', getProducts);

// Admin-only seeding in production (or open for local bootstrap)
productRouter.post('/seed', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return authenticate(req, res, () => requireRole('admin')(req, res, next));
  }
  next();
}, seedSampleData);

// Stock editing restricted to store manager and admin
productRouter.patch(
  '/:id/stock',
  authenticate,
  requireRole('store_manager', 'admin'),
  updateProductStock
);

export default productRouter;
