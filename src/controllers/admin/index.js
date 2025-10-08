import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../models/prismaClient.js";
import { JWT_SECRET } from "../../config/env.js";

export const registerAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existing = await prisma.admin.findUnique({ where: { email } });

    if (existing) return res.status(400).json({ error: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: { email, password: hashedPassword, name },
    });

    res.json({ adminId: admin.adminId, email: admin.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) return res.status(401).json({ error: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { adminId: admin.adminId, email: admin.email },
      JWT_SECRET
      // ,{ expiresIn: "1h" }
    );

    res.json({ token,      admin: { adminId: admin.adminId, name: admin.name, email: admin.email,
    }, });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const products = await prisma.products.findMany();
    res.json({ products, admin: req.admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
