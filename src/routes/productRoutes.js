import { Router } from "express";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../controllers/productController.js";
import { createPurchase, getPurchases } from "../controllers/purchasesController.js";
import { createSale, getSales } from "../controllers/salesController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getProfitsLosses } from "../controllers/profit-loss.js";

const router = Router();

router.get("/", authMiddleware, getProducts);
router.post("/",  authMiddleware, createProduct);
router.put("/:id", authMiddleware, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);
// Purchases
router.get("/purchases",authMiddleware, getPurchases);
router.post("/purchases",authMiddleware, createPurchase);

// Sales
router.get("/sales",authMiddleware, getSales);
router.post("/sales",authMiddleware, createSale);


// Profit & Loss
router.get("/profits-losses", authMiddleware, getProfitsLosses);
export default router;
