import { Router } from 'express';
import { getStores, getStoreSlots } from '../controllers/store.controller.js';

const storeRouter = Router();

storeRouter.get('/', getStores);
storeRouter.get('/:storeId/slots', getStoreSlots);

export default storeRouter;
