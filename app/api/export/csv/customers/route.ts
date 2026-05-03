import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, readSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const csv = (rows: string[][]) =>
  rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");

export async function GET() {
  const user = readSession(cookies().get(COOKIE_NAME)?.value);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Nur Admins duerfen exportieren." }, { status: 403 });
  const db = getDb();
  try {
    const customers = await db.customer.findMany({ orderBy: { name: "asc" } });
    const body = csv([
      ["Name", "Telefon", "WhatsApp", "E-Mail", "Adresse", "Notizen", "DSGVO"],
      ...customers.map((customer: any) => [customer.name, customer.phone, customer.whatsapp, customer.email, customer.address, customer.notes, customer.gdprConsent ? "Ja" : "Nein"])
    ]);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="werkstattplan-kunden.csv"'
      }
    });
  } finally {
    await db.$disconnect();
  }
}
