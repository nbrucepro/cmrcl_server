import express from "express";
import {
  getDesigns,
  getDesignsByCategory,
  createDesign,
  updateDesign,
  deleteDesign,
} from "../controllers/designController.js";

const router = express.Router();

router.get("/", getDesigns);
router.get("/:categoryId", getDesignsByCategory);
router.post("/", createDesign);
router.put("/:id", updateDesign);
router.delete("/:id", deleteDesign);

export default router;
