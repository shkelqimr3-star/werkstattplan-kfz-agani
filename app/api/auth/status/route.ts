import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let db: any;
  try {
    db = getDb();
    const users = await db.staffUser.count();
    return NextResponse.json({ hasUsers: users > 0 });
  } catch {
    return NextResponse.json({ hasUsers: false, setupAvailable: true });
  } finally {
    await db?.$disconnect();
  }
}
