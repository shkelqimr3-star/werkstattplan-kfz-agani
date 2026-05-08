import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const serviceTypes = new Set([
  "Ölwechsel",
  "Reifenwechsel",
  "Bremsen",
  "Batterie",
  "Klimaanlage",
  "Fehlerdiagnose",
  "Ölservice",
  "Bremsen",
  "Diagnose",
  "Inspektion",
  "TÜV Vorbereitung",
  "Reifenwechsel",
  "Klimaservice",
  "Sonstiges"
]);

function asPreferredDate(date?: string, time?: string) {
  if (!date) return null;
  const value = `${date}T${time || "09:00"}`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(request: Request) {
  const body = await request.json();

  const required = ["customerName", "phone", "vehicleBrand", "vehicleModel", "serviceType", "preferredDate", "preferredTime"];
  const missing = required.some((field) => !String(body[field] || "").trim());
  if (missing) {
    return NextResponse.json({ error: "Bitte alle Pflichtfelder ausfuellen." }, { status: 400 });
  }

  const db = getDb();
  try {
    const serviceType = serviceTypes.has(body.serviceType) ? body.serviceType : "Sonstiges";
    const bookingRequest = await db.portalRequest.create({
      data: {
        customerName: String(body.customerName || "").trim(),
        phone: String(body.phone || "").trim(),
        whatsapp: String(body.whatsapp || body.phone || "").trim(),
        email: String(body.email || "").trim(),
        preferredDate: asPreferredDate(body.preferredDate, body.preferredTime),
        preferredTime: String(body.preferredTime || "").trim(),
        serviceType,
        message: String(body.message || "").trim(),
        gdprConsent: Boolean(body.gdprConsent),
        vehicleBrand: String(body.vehicleBrand || "").trim(),
        vehicleModel: String(body.vehicleModel || "").trim(),
        licensePlate: String(body.licensePlate || "").trim(),
        mileage: Number(body.mileage || 0),
        photos: JSON.stringify([]),
        status: "ANGEFRAGT"
      }
    });

    return NextResponse.json({ id: bookingRequest.id });
  } finally {
    await db.$disconnect();
  }
}
