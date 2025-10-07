import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getDashboard,
} from "../controllers/admin/index.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/dashboard", authMiddleware, getDashboard);

export default router;
