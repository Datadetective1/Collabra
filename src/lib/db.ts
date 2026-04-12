import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // Use Turso in production, plain SQLite locally
  if (tursoUrl && tursoToken) {
    const adapter = new PrismaLibSQL({ url: tursoUrl, authToken: tursoToken });
    return new PrismaClient({ adapter } as never);
  }

  return new PrismaClient();
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
