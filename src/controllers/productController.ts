import { Request, Response } from "express";
import prisma from "../utils/database";
import { ApiResponse, PaginationParams } from "../types";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const pagination: PaginationParams = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    };

    const skip = (pagination.page - 1) * pagination.limit;

    const where:any = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};
    
      const orderBy = {
        [pagination.sortBy as keyof typeof prisma.product]: pagination.sortOrder
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { name: true },
          },
        },
        // { [pagination.sortBy]: pagination.sortOrder }
        orderBy,
        skip,
        take: pagination.limit,
      }),
      prisma.product.count({ where }),
    ]);
    const response: ApiResponse = {
      success: true,
      data: {
        products,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
    });
  }
};
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventoryLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }
    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch product",
    });
  }
};
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        type: "ADJUSTMENT",
        quantity: product.quantity,
        previousQty: 0,
        newQty: product.quantity,
        reason: "Product creation",
      },
    });
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create product",
    });
  }
};
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, ...updateData } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }
    // If quantity is being updated, log the change
    if (quantity !== undefined && quantity !== existingProduct.quantity) {
      await prisma.inventoryLog.create({
        data: {
          productId: id,
          type: "ADJUSTMENT",
          quantity: quantity - existingProduct.quantity,
          previousQty: existingProduct.quantity,
          newQty: quantity,
          reason: "Manual quantity adjustment",
        },
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { ...updateData, quantity },
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update product",
    });
  }
};
export const deleteProduct = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      await prisma.product.delete({
        where: { id }
      });
  
      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete product'
      });
    }
  };
  export const updateInventory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { type, quantity, reason } = req.body;
  
      const product = await prisma.product.findUnique({
        where: { id }
      });
  
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }
  
      let newQuantity = product.quantity;
      
      if (type === 'IN') {
        newQuantity += quantity;
      } else if (type === 'OUT') {if (product.quantity < quantity) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient stock'
        });
      }
      newQuantity -= quantity;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { quantity: newQuantity }
    });

    await prisma.inventoryLog.create({
      data: {
        productId: id,
        type,
        quantity,
        previousQty: product.quantity,
        newQty: newQuantity,
        reason
      }});
      res.json({
        success: true,
        data: updatedProduct
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update inventory'
      });
    }
  };  