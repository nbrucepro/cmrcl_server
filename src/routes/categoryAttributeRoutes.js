import express from "express";
import {
  getAttributesByCategory,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from "../controllers/categoryAttributeController.js";

const router = express.Router();

router.get("/:categoryId", getAttributesByCategory);
router.post("/", createAttribute);
router.put("/:id", updateAttribute);
router.delete("/:id", deleteAttribute);

export default router;
