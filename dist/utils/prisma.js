"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/utils/prisma.ts
const client_1 = require("@prisma/client");
const prisma = global.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
if (process.env.NODE_ENV !== "production")
    global.prisma = prisma;
exports.default = prisma;
//# sourceMappingURL=prisma.js.map