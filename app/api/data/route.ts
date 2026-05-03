import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, readSession } from "@/lib/auth";
import { loadAppData } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!readSession(cookies().get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  return NextResponse.json(await loadAppData());
}
