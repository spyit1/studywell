// /lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // 開発環境でのHMR（自動再読み込み）対策
  var prisma: PrismaClient | undefined;
}

// Prismaクライアントを1つだけ生成して使い回す
export const prisma =
  global.prisma ??
  new PrismaClient({
    // ログを見たい場合はコメント解除：
    // log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
