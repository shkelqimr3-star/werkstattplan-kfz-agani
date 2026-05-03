import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, hashPassword, readSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "customer" | "vehicle" | "appointment" | "order" | "invoice" | "part" | "reminder" | "inspection" | "staff";

const rolePermissions: Record<string, Kind[]> = {
  ADMIN: ["customer", "vehicle", "appointment", "order", "invoice", "part", "reminder", "inspection", "staff"],
  MECHANIC: ["vehicle", "order", "part", "reminder", "inspection"],
  RECEPTION: ["customer", "vehicle", "appointment", "invoice", "reminder"]
};

function dateOrNow(value?: string) {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function requirePermission(kind: Kind) {
  const user = readSession(cookies().get(COOKIE_NAME)?.value);
  if (!user) {
    return { error: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  }
  if (!rolePermissions[user.role]?.includes(kind)) {
    return { error: NextResponse.json({ error: "Keine Berechtigung fuer diese Aktion." }, { status: 403 }) };
  }
  return { user };
}

async function firstCustomer(db: any, values: Record<string, string>) {
  const existing = values.customerId ? await db.customer.findUnique({ where: { id: values.customerId } }) : await db.customer.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return db.customer.create({
    data: {
      name: values.customerName || "KFZ Agani Kunde",
      phone: values.phone || "",
      whatsapp: values.phone || "",
      email: "",
      address: "",
      notes: "",
      gdprConsent: false
    }
  });
}

async function firstVehicle(db: any, customerId?: string) {
  return db.vehicle.findFirst({ where: customerId ? { customerId } : undefined, orderBy: { licensePlate: "asc" } });
}

export async function POST(request: Request) {
  const body = await request.json();
  const kind = body.kind as Kind;
  const values = (body.values || {}) as Record<string, string>;
  const permission = requirePermission(kind);
  if (permission.error) return permission.error;

  const db = getDb();
  try {
    if (kind === "customer") {
      await db.customer.create({
        data: {
          name: values.name || "Neuer Kunde",
          phone: values.phone || "",
          whatsapp: values.whatsapp || values.phone || "",
          email: values.email || "",
          address: values.address || "",
          notes: values.notes || "",
          gdprConsent: values.gdprConsent === "on" || values.gdprConsent === "true"
        }
      });
    }

    if (kind === "vehicle") {
      const customer = await firstCustomer(db, values);
      await db.vehicle.create({
        data: {
          customerId: customer.id,
          brand: values.brand || "",
          model: values.model || "",
          licensePlate: values.licensePlate || `NEU-${Date.now()}`,
          vin: values.vin || "",
          mileage: Number(values.mileage || 0),
          engine: values.engine || "",
          year: Number(values.year || new Date().getFullYear()),
          fuelType: values.fuelType || "",
          tuvDate: dateOrNow(values.tuvDate),
          lastOilService: values.lastOilService ? dateOrNow(values.lastOilService) : null,
          nextOilService: values.nextOilService ? dateOrNow(values.nextOilService) : null,
          notes: values.notes || ""
        }
      });
    }

    if (kind === "appointment") {
      const customer = await firstCustomer(db, values);
      const vehicle = await firstVehicle(db, customer.id);
      if (!vehicle) return NextResponse.json({ error: "Bitte zuerst ein Fahrzeug anlegen." }, { status: 400 });
      const startsAt = dateOrNow(values.startsAt);
      const endsAt = values.endsAt ? dateOrNow(values.endsAt) : new Date(startsAt.getTime() + 60 * 60 * 1000);
      await db.appointment.create({
        data: {
          customerId: customer.id,
          vehicleId: vehicle.id,
          startsAt,
          endsAt,
          title: values.title || "Werkstatttermin",
          notes: values.notes || "",
          status: values.status || "ANGEFRAGT"
        }
      });
    }

    if (kind === "order") {
      const customer = await firstCustomer(db, values);
      const vehicle = await firstVehicle(db, customer.id);
      if (!vehicle) return NextResponse.json({ error: "Bitte zuerst ein Fahrzeug anlegen." }, { status: 400 });
      await db.workOrder.create({
        data: {
          number: values.number || `KA-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
          customerId: customer.id,
          vehicleId: vehicle.id,
          customerComplaint: values.customerComplaint || "Kundenbeanstandung erfassen",
          diagnosis: values.diagnosis || "",
          workPerformed: values.workPerformed || "",
          laborHours: Number(values.laborHours || 0),
          mechanicNotes: values.mechanicNotes || "",
          status: values.status || "GEPLANT",
          photoBefore: values.photoBefore || "",
          photoAfter: values.photoAfter || ""
        }
      });
    }

    if (kind === "invoice") {
      const customer = await firstCustomer(db, values);
      const laborCost = Number(values.laborCost || values.total || 0);
      const partsCost = Number(values.partsCost || 0);
      const discount = Number(values.discount || 0);
      const vatRate = Number(values.vatRate || 19);
      const net = laborCost + partsCost - discount;
      const total = values.total ? Number(values.total) : net * (1 + vatRate / 100);
      await db.invoice.create({
        data: {
          number: values.number || `RE-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
          customerId: customer.id,
          type: values.type || "Rechnung",
          laborCost,
          partsCost,
          discount,
          vatRate,
          total,
          status: values.status || "OFFEN",
          items: {
            create: values.description
              ? [{ description: values.description, quantity: Number(values.quantity || 1), unitPrice: laborCost || total }]
              : []
          }
        }
      });
    }

    if (kind === "part") {
      await db.part.create({
        data: {
          name: values.name || "Neues Teil",
          sku: values.sku || `SKU-${Date.now()}`,
          quantity: Number(values.quantity || 0),
          purchasePrice: Number(values.purchasePrice || 0),
          sellingPrice: Number(values.sellingPrice || 0),
          lowStockAt: Number(values.lowStockAt || 3)
        }
      });
    }

    if (kind === "reminder") {
      const vehicle = await firstVehicle(db);
      if (!vehicle) return NextResponse.json({ error: "Bitte zuerst ein Fahrzeug anlegen." }, { status: 400 });
      await db.reminder.create({
        data: {
          vehicleId: vehicle.id,
          type: values.type || "INDIVIDUELL",
          dueAt: dateOrNow(values.dueAt),
          message: values.message || "Neue Erinnerung",
          done: false
        }
      });
    }

    if (kind === "inspection") {
      const checklist = values.checklist ? values.checklist.split("\n").filter(Boolean) : [];
      await db.inspectionPackage.create({
        data: {
          name: values.name || "Neues Inspektionspaket",
          description: values.description || "",
          basePrice: Number(values.basePrice || 0),
          checklist: JSON.stringify(checklist)
        }
      });
    }

    if (kind === "staff") {
      await db.staffUser.create({
        data: {
          name: values.name || "Neuer Benutzer",
          email: String(values.email || "").toLowerCase(),
          passwordHash: hashPassword(values.password || "werkstattplan"),
          role: (values.role || "MECHANIC")
            .replace("Mechanic", "MECHANIC")
            .replace("Reception", "RECEPTION")
            .replace("Admin", "ADMIN")
        }
      });
    }

    return NextResponse.json({ ok: true });
  } finally {
    await db.$disconnect();
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const kind = body.kind as Kind;
  const id = String(body.id || "");
  const values = (body.values || {}) as Record<string, string>;
  const permission = requirePermission(kind);
  if (permission.error) return permission.error;
  const db = getDb();
  try {
    if (kind === "customer") await db.customer.update({ where: { id }, data: values });
    if (kind === "part") await db.part.update({ where: { id }, data: { ...values, quantity: values.quantity === undefined ? undefined : Number(values.quantity) } });
    if (kind === "order") await db.workOrder.update({ where: { id }, data: values });
    if (kind === "appointment") await db.appointment.update({ where: { id }, data: values });
    if (kind === "invoice") await db.invoice.update({ where: { id }, data: values });
    if (kind === "reminder") await db.reminder.update({ where: { id }, data: values });
    return NextResponse.json({ ok: true });
  } finally {
    await db.$disconnect();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") as Kind;
  const id = searchParams.get("id") || "";
  const permission = requirePermission(kind);
  if (permission.error) return permission.error;
  const db = getDb();
  try {
    if (kind === "customer") await db.customer.delete({ where: { id } });
    if (kind === "vehicle") await db.vehicle.delete({ where: { id } });
    if (kind === "appointment") await db.appointment.delete({ where: { id } });
    if (kind === "order") await db.workOrder.delete({ where: { id } });
    if (kind === "invoice") await db.invoice.delete({ where: { id } });
    if (kind === "part") await db.part.delete({ where: { id } });
    if (kind === "reminder") await db.reminder.delete({ where: { id } });
    if (kind === "inspection") await db.inspectionPackage.delete({ where: { id } });
    if (kind === "staff") await db.staffUser.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } finally {
    await db.$disconnect();
  }
}
