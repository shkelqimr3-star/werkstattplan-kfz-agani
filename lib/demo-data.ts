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
    settings: {
      companyName: "KFZ Agani",
      logoDataUrl: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      taxNumber: "",
      vatRate: 19,
      invoicePrefix: "RE",
      nextInvoiceNumber: 1,
      openingHours: "",
      weekendAvailability: true
    },
    metrics: {
      openWorkOrders: 0,
      completedToday: 0,
      monthlyRevenue: 0,
      workshopVehicles: []
    }
  };
}
