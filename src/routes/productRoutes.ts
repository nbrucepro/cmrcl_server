import { Router } from "express";
import { createProduct, getProducts } from "../controllers/productController";
import { createPurchase, getPurchases } from "../controllers/purchasesController";
import { createSale, getSales } from "../controllers/salesController";

const router = Router();

router.get("/", getProducts);
router.post("/", createProduct);
// Purchases
router.get("/purchases", getPurchases);
router.post("/purchases", createPurchase);

// Sales
router.get("/sales", getSales);
router.post("/sales", createSale);

export default router;
