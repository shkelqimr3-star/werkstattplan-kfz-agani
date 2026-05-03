import { addDays, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import { createRequire } from "module";
import { demoData } from "@/lib/demo-data";
import type { AppData } from "@/components/workshop-app";

const require = createRequire(import.meta.url);

function getPrismaClient(): any | null {
  try {
    const { PrismaClient } = require("@prisma/client");
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
    });
  } catch {
    return null;
  }
}

export async function loadAppData(): Promise<AppData> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return demoData();
  }

  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = addDays(todayStart, 1);
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    const [
      customers,
      vehicles,
      appointments,
      todayAppointments,
      workOrders,
      invoices,
      parts,
      reminders,
      inspections,
      packages,
      staff,
      completedToday,
      monthlyPaidInvoices
    ] = await Promise.all([
      prisma.customer.findMany({ include: { vehicles: true }, orderBy: { name: "asc" } }),
      prisma.vehicle.findMany({ include: { customer: true, reminders: true }, orderBy: { licensePlate: "asc" } }),
      prisma.appointment.findMany({ include: { customer: true, vehicle: true }, orderBy: { startsAt: "asc" }, take: 12 }),
      prisma.appointment.findMany({ where: { startsAt: { gte: todayStart, lt: todayEnd } }, include: { customer: true, vehicle: true }, orderBy: { startsAt: "asc" } }),
      prisma.workOrder.findMany({ include: { customer: true, vehicle: true, parts: true }, orderBy: { createdAt: "desc" } }),
      prisma.invoice.findMany({ include: { customer: true, items: true, workOrder: true }, orderBy: { issuedAt: "desc" } }),
      prisma.part.findMany({ orderBy: { name: "asc" } }),
      prisma.reminder.findMany({ include: { vehicle: { include: { customer: true } } }, orderBy: { dueAt: "asc" }, take: 8 }),
      prisma.inspection.findMany({ include: { package: true, vehicle: { include: { customer: true } }, items: true }, orderBy: { createdAt: "desc" } }),
      prisma.inspectionPackage.findMany({ orderBy: { basePrice: "asc" } }),
      prisma.staffUser.findMany({ select: { id: true, name: true, email: true, role: true }, orderBy: { role: "asc" } }),
      prisma.workOrder.count({ where: { completedAt: { gte: todayStart, lt: todayEnd } } }),
      prisma.invoice.findMany({ where: { status: { in: ["BEZAHLT", "TEILWEISE_BEZAHLT", "TEILZAHLUNG"] }, issuedAt: { gte: monthStart, lte: monthEnd } } })
    ]);

    const monthlyRevenue = monthlyPaidInvoices.reduce((sum: number, invoice: any) => sum + invoice.total, 0);
    const workshopVehicles = workOrders
      .filter((order: any) => ["ANGENOMMEN", "DIAGNOSE_LAEUFT", "WARTET_AUF_TEILE", "IN_ARBEIT", "FERTIG"].includes(order.status))
      .map((order: any) => `${order.vehicle.licensePlate} ${order.vehicle.brand} ${order.vehicle.model}`);

    return JSON.parse(
      JSON.stringify({
        customers,
        vehicles,
        appointments,
        todayAppointments,
        workOrders,
        invoices,
        parts,
        reminders,
        inspections,
        packages,
        staff,
        metrics: {
          openWorkOrders: workOrders.filter((order: any) => !["BEZAHLT", "ABGEHOLT"].includes(order.status)).length,
          completedToday,
          monthlyRevenue,
          workshopVehicles
        }
      })
    );
  } catch {
    return demoData();
  } finally {
    await prisma.$disconnect();
  }
}

export async function findInvoice(id: string) {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { customer: true, workOrder: { include: { vehicle: true } }, items: true }
      });
      if (invoice) {
        return invoice;
      }
    } catch {
      // Fall through to bundled demo data.
    } finally {
      await prisma.$disconnect();
    }
  }
  return (demoData().invoices as any[]).find((invoice) => invoice.id === id) ?? null;
}

export async function findInspection(id: string) {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const inspection = await prisma.inspection.findUnique({
        where: { id },
        include: { package: true, vehicle: { include: { customer: true } }, items: true }
      });
      if (inspection) {
        return inspection;
      }
    } catch {
      // Fall through to bundled demo data.
    } finally {
      await prisma.$disconnect();
    }
  }
  return (demoData().inspections as any[]).find((inspection) => inspection.id === id) ?? null;
}
