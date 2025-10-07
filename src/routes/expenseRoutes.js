import { Router } from "express";
import { getExpensesByCategory } from "../controllers/expenseController.js";

const router = Router();

router.get("/", getExpensesByCategory);

export default router;
