import { Router } from "express";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../controllers/productController.js";
import { createPurchase, deletePurchase, getPurchases, updatePurchase } from "../controllers/purchasesController.js";
import { createSale, deleteSale, getSales, getSalesWithProfit, updateSale } from "../controllers/salesController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getProfitsLosses } from "../controllers/profit-loss.js";
import * as rec from "../controllers/receivables.js";
import * as pay from "../controllers/payables.js";

const router = Router();

router.get("/", authMiddleware, getProducts);
router.post("/",  authMiddleware, createProduct);
router.put("/:id", authMiddleware, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);
// Purchases
router.get("/purchases",authMiddleware, getPurchases);
router.post("/purchases",authMiddleware, createPurchase);
router.put("/purchases/:purchaseId",authMiddleware,updatePurchase)
router.delete("/purchases/:purchaseId",authMiddleware,deletePurchase)

// Sales
router.get("/sales",authMiddleware, getSalesWithProfit);
router.post("/sales",authMiddleware, createSale);
router.put("/sales/:saleId",authMiddleware,updateSale)
router.delete("/sales/:saleId",authMiddleware,deleteSale)

//finance

router.post("/receivables",authMiddleware, rec.createReceivable);
router.get("/receivables",authMiddleware, rec.getReceivables);
router.put("/receivables/:receivableId",authMiddleware, rec.updateReceivable); // generic update
router.post("/receivables/:receivableId/pay",authMiddleware, rec.recordReceivablePayment);
router.delete("/receivables/:receivableId",authMiddleware, rec.deleteReceivable);

// Payables
router.post("/payables",authMiddleware, pay.createPayable);
router.get("/payables",authMiddleware, pay.getPayables);
router.put("/payables/:payableId",authMiddleware, pay.updatePayable);
router.post("/payables/:payableId/pay",authMiddleware, pay.recordPayablePayment);
router.delete("/payables/:payableId",authMiddleware, pay.deletePayable);

// Profit & Loss
router.get("/profits-losses", authMiddleware, getProfitsLosses);
export default router;
