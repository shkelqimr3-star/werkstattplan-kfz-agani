import type { AppData } from "@/components/workshop-app";

export function demoData(): AppData {
  return {
    customers: [],
    vehicles: [],
    appointments: [],
    todayAppointments: [],
    workOrders: [],
    invoices: [],
    parts: [],
    reminders: [],
    inspections: [],
    packages: [],
    staff: [],
    metrics: {
      openWorkOrders: 0,
      completedToday: 0,
      monthlyRevenue: 0,
      workshopVehicles: []
    }
  };
}
