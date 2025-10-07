"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const url = process.env.DATABASE_URL;
// process.env.NODE_ENV === 'development'
//     ? process.env.DATABASE_URL_LOCAL
//     : process.env.DATABASE_URL_PROD;
if (!url) {
    throw new Error("❌ DATABASE_URL is not set correctly.");
}
// Override DATABASE_URL at runtime
process.env.DATABASE_URL = url;
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
exports.default = prisma;
//# sourceMappingURL=prismaClient.js.map