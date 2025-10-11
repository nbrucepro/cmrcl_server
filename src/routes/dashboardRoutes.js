import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboardController.js";
// import { getDashboardMetrics } from "../utils/tra/dashboardController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/",authMiddleware, getDashboardMetrics);

export default router;
