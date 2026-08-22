import { Router } from 'express';
import authRouter from './auth.routes.js';
import cartRouter from './cart.routes.js';
import orderRouter from './order.routes.js';
import storeRouter from './store.routes.js';
import productRouter from './product.routes.js';
import returnRouter from './return.routes.js';
import categoryRouter from './category.routes.js';
import adminRouter from './admin.routes.js';

const apiRouter = Router();

// Subsystem Routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/stores', storeRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/returns', returnRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/admin', adminRouter);

// Health check route
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'Mini D-Mart API',
      timestamp: new Date().toISOString(),
    },
    error: null,
    message: 'Mini D-Mart API is running smoothly',
  });
});

export default apiRouter;
