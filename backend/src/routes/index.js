import { Router } from 'express';
import authRouter from './auth.routes.js';

const apiRouter = Router();

// Auth routes
apiRouter.use('/auth', authRouter);

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
