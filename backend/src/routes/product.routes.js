import { Router } from 'express';
import { getProducts, seedSampleData } from '../controllers/product.controller.js';

const productRouter = Router();

productRouter.get('/', getProducts);
productRouter.post('/seed', seedSampleData);

export default productRouter;
