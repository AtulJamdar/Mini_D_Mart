import { Router } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
} from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.js';

const paymentRouter = Router();

// Server-to-server webhook (no user JWT auth, relies on HMAC webhook signature)
paymentRouter.post('/razorpay/webhook', handleWebhook);

// Customer endpoints (require JWT authentication)
paymentRouter.post('/razorpay/order', authenticate, createPaymentOrder);
paymentRouter.post('/razorpay/verify', authenticate, verifyPayment);

export default paymentRouter;
