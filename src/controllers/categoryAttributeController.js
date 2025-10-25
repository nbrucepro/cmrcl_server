import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAttributesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const attrs = await prisma.categoryAttribute.findMany({ where: { categoryId } });
    res.json(attrs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attributes", error: err.message });
  }
};

export const createAttribute = async (req, res) => {
  try {
    const { name, categoryId } = req.body;
    if (!name || !categoryId)
      return res.status(400).json({ message: "Missing required fields" });

    const attr = await prisma.categoryAttribute.create({ data: { name, categoryId } });
    res.json(attr);
  } catch (err) {
    res.status(500).json({ message: "Error creating attribute", error: err.message });
  }
};

export const updateAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updated = await prisma.categoryAttribute.update({
      where: { attributeId: id },
      data: { name },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating attribute", error: err.message });
  }
};

export const deleteAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.categoryAttribute.delete({ where: { attributeId: id } });
    res.json({ message: "Attribute deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting attribute", error: err.message });
  }
};
