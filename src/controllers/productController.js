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
          // name: { contains: search, mode: "insensitive" },
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
          ],
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
            ...(v.attributes && v.attributes.length > 0 && {
              attributes: {
                create: v.attributes.map((attr) => ({
                  name: attr.name,
                  value: attr.value,
                })),
              },
            }),
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

    // Prisma unique constraint error
    if (error.code === "P2002") {
      return res.status(400).json({
        message: `Duplicate value: ${error.meta?.target?.join(", ")} must be unique.`,
      });
    }
  
    // Prisma validation error
    if (error.code === "P2003") {
      return res.status(400).json({
        message: `Invalid reference in related field.`,
      });
    }
  
    // Default fallback for unexpected errors
    res.status(500).json({ message: error.message || "Something went wrong" });
  }
};


export const updateProduct = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const { id } = req.params; // productId
    const { name,categoryId, description, rating, variants } = req.body;

    // fetch product + existing variants for permission check and optional sync logic
    const product = await prisma.products.findUnique({
      where: { productId: id },
      include: { variants: { include: { attributes: true } } },
    });

    if (!product || product.adminId !== adminId) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    // Run changes in a single transaction
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // 1) update product basic fields
      await tx.products.update({
        where: { productId: id },
        data: { name,categoryId, description, rating },
      });

      // 2) For each variant in payload: update existing or create new
      if (Array.isArray(variants)) {
        for (const v of variants) {
          // update existing variant (replace attributes)
          if (v.variantId) {
            await tx.productVariant.update({
              where: { variantId: v.variantId },
              data: {
                sku: v.sku,
                purchasePrice: v.purchasePrice,
                sellingPrice: v.sellingPrice,
                stockQuantity: v.stockQuantity,
              },
            });

            // remove old attributes then bulk create new attributes for this variant
            await tx.productVariantAttribute.deleteMany({
              where: { variantId: v.variantId },
            });

            if (v.attributes && v.attributes.length > 0) {
              // use createMany for speed (or loop create if you need hooks/triggers)
              await tx.productVariantAttribute.createMany({
                data: v.attributes.map((a) => ({
                  variantId: v.variantId,
                  name: a.name,
                  value: a.value,
                })),
              });
            }
          } else {
            // create new variant (with nested create of attributes)
            await tx.productVariant.create({
              data: {
                productId: id,
                sku: v.sku,
                purchasePrice: v.purchasePrice,
                sellingPrice: v.sellingPrice,
                stockQuantity: v.stockQuantity,
                ...(v.attributes && v.attributes.length > 0
                  ? {
                      attributes: {
                        create: v.attributes.map((a) => ({
                          name: a.name,
                          value: a.value,
                        })),
                      },
                    }
                  : {}),
              },
            });
          }
        }
      }

      // 3) return updated product with relations
      return tx.products.findUnique({
        where: { productId: id },
        include: { variants: { include: { attributes: true } } },
      });
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error("updateProduct error:", error);
    // helpful error message for common Prisma issues
    if (error.code === "P2002") {
      return res.status(400).json({ message: `Unique constraint failed: ${JSON.stringify(error.meta)}` });
    }
    res.status(500).json({ message: error.message || "Error updating product" });
  }
};


export const deleteProduct = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const { id } = req.params;

    const product = await prisma.products.findUnique({
      where: { productId: id },
      include: { variants: true, Sales: true, Purchases: true },
    });

    if (!product || product.adminId !== adminId) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    if (product.Sales.length > 0 || product.Purchases.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete this product because it has associated sales or purchases records.",
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const variant of product.variants) {
        await tx.productVariantAttribute.deleteMany({
          where: { variantId: variant.variantId },
        });
      }

      await tx.productVariant.deleteMany({
        where: { productId: id },
      });

      await tx.products.delete({
        where: { productId: id },
      });
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Error deleting product",
    });
  }
};

