import { Router } from 'express';
import productRoutes from './productRoutes';
// Import other routes here

const router = Router();

router.use('/products', productRoutes);
// Add other routes here

export default router;