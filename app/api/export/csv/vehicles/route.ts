import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, readSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const csv = (rows: string[][]) =>
  rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");

export async function GET() {
  const user = readSession(cookies().get(COOKIE_NAME)?.value);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Nur Admins duerfen exportieren." }, { status: 403 });
  const db = getDb();
  try {
    const vehicles = await db.vehicle.findMany({ include: { customer: true }, orderBy: { licensePlate: "asc" } });
    const body = csv([
      ["Kunde", "Marke", "Modell", "Kennzeichen", "VIN", "Kilometer", "Motor", "Kraftstoff", "Baujahr", "TUEV", "Letzter Service", "Naechster Service"],
      ...vehicles.map((vehicle: any) => [
        vehicle.customer.name,
        vehicle.brand,
        vehicle.model,
        vehicle.licensePlate,
        vehicle.vin,
        vehicle.mileage,
        vehicle.engine,
        vehicle.fuelType,
        vehicle.year,
        formatDate(vehicle.tuvDate),
        vehicle.lastOilService ? formatDate(vehicle.lastOilService) : "",
        vehicle.nextOilService ? formatDate(vehicle.nextOilService) : ""
      ])
    ]);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="werkstattplan-fahrzeuge.csv"'
      }
    });
  } finally {
    await db.$disconnect();
  }
}
