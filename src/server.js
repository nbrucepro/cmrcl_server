import app from "./index.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // await prisma.$connect();
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
// process.on("SIGINT", async () => {
//   await prisma.$disconnect();
//   console.log("🔌 Database disconnected");
//   process.exit(0);
// });
