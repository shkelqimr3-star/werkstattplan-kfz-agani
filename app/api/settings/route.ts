import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, readSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdmin() {
  const user = readSession(cookies().get(COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Nur Admins duerfen Einstellungen aendern." }, { status: 403 });
  return null;
}

export async function PUT(request: Request) {
  const blocked = requireAdmin();
  if (blocked) return blocked;
  const body = await request.json();
  const db = getDb();
  try {
    const existing = await db.companySettings.findFirst();
    const data = {
      companyName: body.companyName || "KFZ Agani",
      logoDataUrl: body.logoDataUrl || "",
      address: body.address || "",
      phone: body.phone || "",
      email: body.email || "",
      website: body.website || "",
      taxNumber: body.taxNumber || "",
      vatRate: Number(body.vatRate || 19),
      invoicePrefix: body.invoicePrefix || "RE",
      nextInvoiceNumber: Number(body.nextInvoiceNumber || 1),
      openingHours: body.openingHours || "",
      weekendAvailability: body.weekendAvailability === "on" || body.weekendAvailability === true
    };
    const settings = existing
      ? await db.companySettings.update({ where: { id: existing.id }, data })
      : await db.companySettings.create({ data });
    return NextResponse.json({ settings });
  } finally {
    await db.$disconnect();
  }
}
