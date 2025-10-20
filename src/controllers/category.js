import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getCategories = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const search = req.query.search?.toString();

    const categories = await prisma.category.findMany({
      where: {
        adminId,
        ...(search && { name: { contains: search, mode: "insensitive" } }),
      },
      orderBy: { name: "asc" },
    });

    res.json(categories);
  } catch (error) {
    console.error("getCategories error:", error);
    res.status(500).json({ message: "Error retrieving categories" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const { name } = req.body;

    // prevent duplicate category names for same admin
    const exists = await prisma.category.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, adminId },
    });
    if (exists) {
      return res.status(400).json({ message: "Category name already exists." });
    }

    const category = await prisma.category.create({
      data: { name, adminId },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("createCategory error:", error);
    res.status(500).json({ message: "Error creating category" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.category.findUnique({
      where: { categoryId: id },
    });

    if (!category || category.adminId !== adminId) {
      return res.status(404).json({ message: "Category not found or unauthorized" });
    }

    const updated = await prisma.category.update({
      where: { categoryId: id },
      data: { name },
    });

    res.json(updated);
  } catch (error) {
    console.error("updateCategory error:", error);
    res.status(500).json({ message: "Error updating category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { categoryId: id },
      include: { products: true },
    });

    if (!category || category.adminId !== adminId) {
      return res.status(404).json({ message: "Category not found or unauthorized" });
    }

    if (category.products.length > 0) {
      return res.status(400).json({
        message: "Cannot delete category because it has associated products.",
      });
    }

    await prisma.category.delete({ where: { categoryId: id } });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("deleteCategory error:", error);
    res.status(500).json({ message: "Error deleting category" });
  }
};
