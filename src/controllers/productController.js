import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all products belonging to the logged-in admin
export const getProducts = async (req, res) => {
  try {
    const adminId = req.admin.adminId; // from token
    const search = req.query.search?.toString();

    const products = await prisma.products.findMany({
      where: {
        adminId,
        ...(search && {
          name: { contains: search, mode: "insensitive" },
        }),
      },
      include: {
        variants: {
          include: {
            attributes: true, // ✅ include attributes for each variant
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving products" });
  }
};

// 🟢 Create a new product (automatically linked to logged-in admin)
export const createProduct = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const { name,categoryId, rating,description, variants } = req.body;

    const product = await prisma.products.create({
      data: {
        name,
        rating,
        description: description || null,
        categoryId, 
        adminId,
        variants: {
          create: variants.map((v) => ({
            sku: v.sku,
            purchasePrice: v.purchasePrice,
            sellingPrice: v.sellingPrice,
            stockQuantity: v.stockQuantity || 0,
            attributes: {
              create: v.attributes.map((attr) => ({
                name: attr.name,
                value: attr.value,
              })),
            },
          })),
        },
      },
      include: {
        variants: { include: { attributes: true } },
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating product with variants" });
  }
};



// 🟡 Update product (only if it belongs to this admin)
export const updateProduct = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const { id } = req.params;

    const { name, description, rating } = req.body;
    const product = await prisma.products.findUnique({ where: { productId: id } });

    if (!product || product.adminId !== adminId) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }


    const updated = await prisma.products.update({
        where: { productId: id },
        data: { name, description, rating },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating product" });
  }
};

// 🔴 Delete product (only if owned by admin)
export const deleteProduct = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const { id } = req.params;

    const product = await prisma.products.findUnique({ where: {productId:id } });

    if (!product || product.adminId !== adminId) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    await prisma.products.delete({ where: { productId:id } });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product" });
  }
};
