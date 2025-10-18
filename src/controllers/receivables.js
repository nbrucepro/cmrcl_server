// controllers/receivables.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createReceivable = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    const { saleId, customerName, contactInfo, amountDue, amountPaid = 0, dueDate, notes } = req.body;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const status = amountPaid >= amountDue ? "paid" : amountPaid > 0 ? "partial" : "unpaid";

    const r = await prisma.receivable.create({
      data: {
        saleId,
        adminId,
        customerName,
        contactInfo,
        amountDue,
        amountPaid,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
        notes,
      },
    });
    if (amountPaid > 0) {
      await prisma.receivablePayment.create({
        data: {
          receivableId: r.receivableId,
          amount: amountPaid,
          method: "Initial",
          notes: "Initial payment at sale creation",
        },
      });
    }    
    res.status(201).json(r);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating receivable" });
  }
};

export const getReceivables = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    const list = await prisma.receivable.findMany({
      where: { adminId },
      include: {
        sale: {
            include:{
                product: {
                    include: {
                      variants: {
                        include: {
                          attributes:true
                        }
                      },
                    },
                  },
            }
        },
        payments:true
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching receivables" });
  }
};

export const recordReceivablePayment = async (req, res) => {
    try {
      const adminId = req.admin?.adminId;
      const { receivableId } = req.params;
      const { paymentAmount, method, reference, notes } = req.body;
      if (!adminId) return res.status(401).json({ message: "Unauthorized" });
  
      const rec = await prisma.receivable.findUnique({ where: { receivableId } });
      if (!rec) return res.status(404).json({ message: "Receivable not found" });
  
      // Create a payment record
      await prisma.receivablePayment.create({
        data: {
          receivableId,
          amount: Number(paymentAmount),
          method,
          reference,
          notes,
        },
      });
  
      // Recalculate totals
      const payments = await prisma.receivablePayment.findMany({
        where: { receivableId },
      });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, rec.amountDue - totalPaid);
      const status = remaining === 0 ? "paid" : totalPaid > 0 ? "partial" : "unpaid";
  
      const updated = await prisma.receivable.update({
        where: { receivableId },
        data: { amountPaid: totalPaid, status },
      });
  
      res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error recording payment" });
    }
  };
  

export const updateReceivable = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    const { receivableId } = req.params;
    const payload = req.body;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    // Only allow certain fields to be updated in payload; sanitize as needed
    const updated = await prisma.receivable.update({
      where: { receivableId },
      data: payload,
    });
    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating receivable" });
  }
};

export const deleteReceivable = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    const { receivableId } = req.params;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    await prisma.receivable.delete({ where: { receivableId } });
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting receivable" });
  }
};
