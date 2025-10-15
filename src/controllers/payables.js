// controllers/payables.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createPayable = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    const { purchaseId, supplierName, contactInfo, amountDue, amountPaid = 0, dueDate, notes } = req.body;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const status = amountPaid >= amountDue ? "paid" : amountPaid > 0 ? "partial" : "unpaid";

    const p = await prisma.payable.create({
      data: {
        purchaseId,
        adminId,
        supplierName,
        contactInfo,
        amountDue,
        amountPaid,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
        notes,
      },
    });
    res.status(201).json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating payable" });
  }
};

export const getPayables = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    const list = await prisma.payable.findMany({
      where: { adminId },
      include: { purchase: {
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
      } },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching payables" });
  }
};

export const recordPayablePayment = async (req, res) => {
    try {
      const adminId = req.admin?.adminId;
      const { payableId } = req.params;
      const { paymentAmount, method, reference, notes } = req.body;
      if (!adminId) return res.status(401).json({ message: "Unauthorized" });
  
      const pay = await prisma.payable.findUnique({ where: { payableId } });
      if (!pay) return res.status(404).json({ message: "Payable not found" });
  
      // Create a payment record
      await prisma.payablePayment.create({
        data: {
          payableId,
          amount: Number(paymentAmount),
          method,
          reference,
          notes,
        },
      });
  
      // Recalculate totals
      const payments = await prisma.payablePayment.findMany({
        where: { payableId },
      });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, pay.amountDue - totalPaid);
      const status = remaining === 0 ? "paid" : totalPaid > 0 ? "partial" : "unpaid";
  
      const updated = await prisma.payable.update({
        where: { payableId },
        data: { amountPaid: totalPaid, amountDue: remaining, status },
      });
  
      res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error recording payment" });
    }
  };
  

export const updatePayable = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    const { payableId } = req.params;
    const payload = req.body;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const updated = await prisma.payable.update({
      where: { payableId },
      data: payload,
    });
    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating payable" });
  }
};

export const deletePayable = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    const { payableId } = req.params;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    await prisma.payable.delete({ where: { payableId } });
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting payable" });
  }
};
