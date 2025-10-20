// src/index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";


dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.get("/", (req, res) => {
  res.send("Server is live 🚀");
});

app.use(
  cors({
    origin: true, 
    credentials: true, 
  })
);

// Logging
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));


// API routes
app.use("/api", routes);

app.use("/dashboard", dashboardRoutes); 
app.use("/products", productRoutes); 
app.use("/users", userRoutes); 
app.use("/expenses", expenseRoutes); 
app.use("/api/admin", adminRoutes);


// Error handler
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
  });
});

export default app;
