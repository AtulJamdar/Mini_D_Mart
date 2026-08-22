import { Router } from 'express';
import {
  getStores,
  createStore,
  updateStore,
  getStoreSlots,
  getStoreAnalytics,
} from '../controllers/store.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const storeRouter = Router();

storeRouter.get('/', getStores);
storeRouter.get('/:storeId/slots', getStoreSlots);

storeRouter.post('/', authenticate, requireRole('admin'), createStore);
storeRouter.patch('/:id', authenticate, requireRole('admin'), updateStore);

storeRouter.get(
  '/:storeId/analytics',
  authenticate,
  requireRole('store_staff', 'store_manager', 'admin'),
  getStoreAnalytics
);

export default storeRouter;
