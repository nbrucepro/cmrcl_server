import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDesigns = async (req, res) => {
  try {
    const designs = await prisma.design.findMany({
      include: { category: true },
    });
    res.json(designs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching designs", error: err.message });
  }
};

export const getDesignsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const designs = await prisma.design.findMany({ where: { categoryId } });
    res.json(designs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching category designs", error: err.message });
  }
};

export const createDesign = async (req, res) => {
  try {
    const { name, sizes, categoryId } = req.body;
    if (!name || !categoryId) return res.status(400).json({ message: "Missing required fields" });

    const design = await prisma.design.create({
      data: { name, sizes, categoryId },
    });
    res.json(design);
  } catch (err) {
    res.status(500).json({ message: "Error creating design", error: err.message });
  }
};

export const updateDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sizes } = req.body;

    const updated = await prisma.design.update({
      where: { designId: id },
      data: { name, sizes },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating design", error: err.message });
  }
};

export const deleteDesign = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.design.delete({ where: { designId: id } });
    res.json({ message: "Design deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting design", error: err.message });
  }
};
