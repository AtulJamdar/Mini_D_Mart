import { Router } from 'express';
import {
  getProducts,
  updateProductStock,
  seedSampleData,
} from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const productRouter = Router();

productRouter.get('/', getProducts);
productRouter.post('/seed', seedSampleData);

productRouter.patch(
  '/:id/stock',
  authenticate,
  requireRole('store_manager', 'admin'),
  updateProductStock
);

export default productRouter;
