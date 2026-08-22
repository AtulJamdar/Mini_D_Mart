import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItemQty,
  removeItem,
  clearCart,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middlewares/auth.js';

const cartRouter = Router();

// All cart routes require authentication
cartRouter.use(authenticate);

cartRouter.get('/', getCart);
cartRouter.post('/items', addItem);
cartRouter.put('/items/:productId', updateItemQty);
cartRouter.delete('/items/:productId', removeItem);
cartRouter.delete('/', clearCart);

export default cartRouter;
