import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, sessionCookie, signSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();
  try {
    const users = await db.staffUser.count();
    if (users > 0) {
      return NextResponse.json({ error: "Setup wurde bereits abgeschlossen." }, { status: 409 });
    }
    const user = await db.staffUser.create({
      data: {
        name: body.name || "KFZ Agani Admin",
        email: String(body.email || "").toLowerCase(),
        passwordHash: hashPassword(String(body.password || "")),
        role: "ADMIN"
      }
    });
    await db.companySettings.create({
      data: {
        companyName: body.companyName || "KFZ Agani",
        logoDataUrl: body.logoDataUrl || "",
        address: body.address || "",
        phone: body.phone || "",
        email: body.companyEmail || body.email || "",
        website: body.website || "",
        taxNumber: body.taxNumber || "",
        vatRate: Number(body.vatRate || 19),
        invoicePrefix: body.invoicePrefix || "RE",
        openingHours: body.openingHours || "",
        weekendAvailability: body.weekendAvailability === "on" || body.weekendAvailability === true
      }
    });
    const sessionUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    return NextResponse.json(
      { user: sessionUser },
      { headers: { "Set-Cookie": sessionCookie(signSession(sessionUser)) } }
    );
  } finally {
    await db.$disconnect();
  }
}
