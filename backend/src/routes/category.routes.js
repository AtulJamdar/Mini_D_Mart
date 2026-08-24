import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const categoryRouter = Router();

categoryRouter.get('/', getCategories);
categoryRouter.post('/', authenticate, requireRole('admin'), createCategory);
categoryRouter.patch('/:id', authenticate, requireRole('admin'), updateCategory);
categoryRouter.delete('/:id', authenticate, requireRole('admin'), deleteCategory);

export default categoryRouter;
