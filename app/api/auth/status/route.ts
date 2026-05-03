import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  try {
    const users = await db.staffUser.count();
    return NextResponse.json({ hasUsers: users > 0 });
  } finally {
    await db.$disconnect();
  }
}
