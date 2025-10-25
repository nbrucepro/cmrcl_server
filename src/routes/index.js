import { Router } from 'express';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import designRoutes from "./designRoutes.js";
import categoryAttributeRoutes from "./categoryAttributeRoutes.js";
// Import other routes here

const router = Router();

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);

router.use("/designs", designRoutes);
router.use("/category-attributes", categoryAttributeRoutes);
// Add other routes here

export default router;