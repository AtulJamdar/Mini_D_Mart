import { Router } from 'express';
import {
  getStores,
  getStoreSlots,
  getStoreAnalytics,
} from '../controllers/store.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const storeRouter = Router();

storeRouter.get('/', getStores);
storeRouter.get('/:storeId/slots', getStoreSlots);

storeRouter.get(
  '/:storeId/analytics',
  authenticate,
  requireRole('store_staff', 'store_manager', 'admin'),
  getStoreAnalytics
);

export default storeRouter;
