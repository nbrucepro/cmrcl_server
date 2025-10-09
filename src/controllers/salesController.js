import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// CREATE Sale (already good)
export const createSale = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    const { productId, quantity, unitPrice } = req.body;

    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const product = await prisma.products.findUnique({
        where: { productId },
        include: { variants: true },
    });
      
    if (!product) return res.status(404).json({ message: "Product not found" });
     if (product.variants[0].stockQuantity < quantity)
      return res.status(400).json({ message: "Not enough stock available" });


    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sales.create({
        data: {
          productId,
          adminId, // ✅ include adminId
          quantity,
          unitPrice,
          totalAmount: quantity * unitPrice,
          timestamp: new Date(),
        },
      });

      await tx.productVariant.update({
          where: { variantId: product.variants[0].variantId },
          data: { stockQuantity: { decrement: quantity } },
      });

      return newSale;
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating sale" });
  }
};

// GET All Sales
export const getSales = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const sales = await prisma.sales.findMany({
      where: { adminId },
      include: {
        product: {
          include: {
            variants: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    const formatted = sales.map((s) => {
      const variant = s.product?.variants?.[0];
      return {
        saleId: s.saleId,
        productId: s.productId,
        productName: s.product?.name || "—",
        sellingPrice: variant?.sellingPrice || s.unitPrice,
        quantity: s.quantity,
        totalAmount: s.totalAmount,
        stockAfterSale: variant?.stockQuantity || 0,
        date: s.timestamp,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error retrieving sales:", error);
    res.status(500).json({ message: "Error retrieving sales" });
  }
};

