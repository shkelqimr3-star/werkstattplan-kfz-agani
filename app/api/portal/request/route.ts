import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.gdprConsent) {
    return NextResponse.json({ error: "Bitte Datenschutz-Einwilligung bestaetigen." }, { status: 400 });
  }
  const db = getDb();
  try {
    const portalRequest = await db.portalRequest.create({
      data: {
        customerName: body.customerName || "",
        phone: body.phone || "",
        whatsapp: body.whatsapp || body.phone || "",
        email: body.email || "",
        preferredDate: asDate(body.preferredDate),
        preferredTime: body.preferredTime || "",
        serviceType: body.serviceType || "Sonstiges",
        message: body.message || "",
        gdprConsent: true,
        vehicleBrand: body.vehicleBrand || "",
        vehicleModel: body.vehicleModel || "",
        licensePlate: body.licensePlate || "",
        mileage: Number(body.mileage || 0),
        photos: JSON.stringify(body.photos || [])
      }
    });
    return NextResponse.json({ id: portalRequest.id });
  } finally {
    await db.$disconnect();
  }
}
