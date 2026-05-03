import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, readSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = readSession(cookies().get(COOKIE_NAME)?.value);
  return NextResponse.json({ user });
}
