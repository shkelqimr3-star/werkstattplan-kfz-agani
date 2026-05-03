import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sessionCookie, signSession, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();
  try {
    const user = await db.staffUser.findUnique({ where: { email: String(body.email || "").toLowerCase() } });
    if (!user || !verifyPassword(String(body.password || ""), user.passwordHash)) {
      return NextResponse.json({ error: "E-Mail oder Passwort ist falsch." }, { status: 401 });
    }
    const sessionUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    return NextResponse.json(
      { user: sessionUser },
      { headers: { "Set-Cookie": sessionCookie(signSession(sessionUser)) } }
    );
  } finally {
    await db.$disconnect();
  }
}
