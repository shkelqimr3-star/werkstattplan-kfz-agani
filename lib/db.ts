import { createRequire } from "module";

const require = createRequire(import.meta.url);

export function getDb(): any {
  const { PrismaClient } = require("@prisma/client");
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });
}
