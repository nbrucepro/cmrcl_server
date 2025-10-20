import { Router } from 'express';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
// Import other routes here

const router = Router();

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
// Add other routes here

export default router;