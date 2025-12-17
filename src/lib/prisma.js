import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"], // Opsional: agar terlihat log query SQL-nya
});

export default prisma;
