import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, readSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdmin() {
  const user = readSession(cookies().get(COOKIE_NAME)?.value);
  if (!user) {
    return { error: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  }
  if (user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Nur Admins koennen Terminanfragen bearbeiten." }, { status: 403 }) };
  }
  return { user };
}

function appointmentTimes(request: any) {
  const startsAt = request.preferredDate ? new Date(request.preferredDate) : new Date();
  if (request.preferredTime) {
    const [hours, minutes] = String(request.preferredTime).split(":").map(Number);
    if (Number.isFinite(hours)) startsAt.setHours(hours, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  }
  return {
    startsAt,
    endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000)
  };
}

async function createCustomerVehicleAppointment(db: any, request: any, appointmentStatus: string) {
  const contactMatches: Record<string, string>[] = [{ phone: request.phone }];
  if (request.email) contactMatches.push({ email: request.email });
  let customer = await db.customer.findFirst({ where: { OR: contactMatches } });
  if (!customer) {
    customer = await db.customer.create({
      data: {
        name: request.customerName,
        phone: request.phone,
        whatsapp: request.whatsapp || request.phone,
        email: request.email || "",
        address: "",
        notes: request.message || "",
        gdprConsent: request.gdprConsent
      }
    });
  }

  let vehicle = request.licensePlate ? await db.vehicle.findUnique({ where: { licensePlate: request.licensePlate } }) : null;
  if (!vehicle) {
    vehicle = await db.vehicle.create({
      data: {
        customerId: customer.id,
        brand: request.vehicleBrand,
        model: request.vehicleModel,
        licensePlate: request.licensePlate || `ANFRAGE-${Date.now().toString().slice(-6)}`,
        vin: "",
        mileage: Number(request.mileage || 0),
        engine: "",
        year: new Date().getFullYear(),
        fuelType: "unbekannt",
        tuvDate: new Date(),
        notes: request.message || ""
      }
    });
  } else if (vehicle.customerId !== customer.id) {
    customer = (await db.customer.findUnique({ where: { id: vehicle.customerId } })) || customer;
  }
  const { startsAt, endsAt } = appointmentTimes(request);
  const appointment = await db.appointment.create({
    data: {
      customerId: customer.id,
      vehicleId: vehicle.id,
      startsAt,
      endsAt,
      title: request.serviceType || "Werkstatttermin",
      notes: request.message || "",
      status: appointmentStatus
    }
  });
  return { customer, vehicle, appointment };
}

export async function PATCH(request: Request) {
  const permission = requireAdmin();
  if (permission.error) return permission.error;

  const body = await request.json();
  const id = String(body.id || "");
  const action = String(body.action || "");
  if (!id || !["confirm", "reject", "convert"].includes(action)) {
    return NextResponse.json({ error: "Ungueltige Aktion." }, { status: 400 });
  }

  const db = getDb();
  try {
    const bookingRequest = await db.portalRequest.findUnique({ where: { id } });
    if (!bookingRequest) {
      return NextResponse.json({ error: "Terminanfrage nicht gefunden." }, { status: 404 });
    }
    if (bookingRequest.status !== "ANGEFRAGT") {
      return NextResponse.json({ error: "Terminanfrage wurde bereits bearbeitet." }, { status: 409 });
    }

    if (action === "reject") {
      await db.portalRequest.update({ where: { id }, data: { status: "ABGELEHNT" } });
      return NextResponse.json({ ok: true });
    }

    if (action === "confirm") {
      await createCustomerVehicleAppointment(db, bookingRequest, "BESTAETIGT");
      await db.portalRequest.update({ where: { id }, data: { status: "BESTAETIGT" } });
      return NextResponse.json({ ok: true });
    }

    const { customer, vehicle } = await createCustomerVehicleAppointment(db, bookingRequest, "BESTAETIGT");
    await db.workOrder.create({
      data: {
        number: `KA-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        customerId: customer.id,
        vehicleId: vehicle.id,
        customerComplaint: [bookingRequest.serviceType, bookingRequest.message].filter(Boolean).join(" - ") || "Terminanfrage",
        diagnosis: "",
        workPerformed: "",
        laborHours: 0,
        mechanicNotes: "Aus oeffentlicher Terminanfrage erstellt.",
        status: "GEPLANT",
        photoBefore: "",
        photoAfter: ""
      }
    });
    await db.portalRequest.update({ where: { id }, data: { status: "KONVERTIERT" } });
    return NextResponse.json({ ok: true });
  } finally {
    await db.$disconnect();
  }
}
