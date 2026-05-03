"use client";

import { useEffect, useMemo, useState, type ComponentType, type FormEvent, type PointerEvent } from "react";
import {
  ArrowRight,
  BadgeEuro,
  Bell,
  CalendarDays,
  Camera,
  Car,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileText,
  Gauge,
  LogOut,
  Menu,
  Moon,
  Package,
  PenLine,
  Phone,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Timer,
  UserRound,
  Users,
  Wrench,
  X
} from "lucide-react";
import clsx from "clsx";
import { currency, formatDate, formatTime, number, whatsappLink } from "@/lib/format";

type Customer = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  gdprConsent: boolean;
  vehicles: Vehicle[];
};

type Vehicle = {
  id: string;
  customerId: string;
  customer?: Customer;
  brand: string;
  model: string;
  licensePlate: string;
  vin?: string | null;
  mileage: number;
  engine?: string | null;
  year: number;
  fuelType: string;
  tuvDate: string;
  lastOilService?: string | null;
  nextOilService?: string | null;
  reminders?: Reminder[];
};

type Appointment = {
  id: string;
  customer: Customer;
  vehicle: Vehicle;
  startsAt: string;
  endsAt: string;
  title: string;
  notes?: string | null;
  status: string;
};

type WorkOrder = {
  id: string;
  number: string;
  customer: Customer;
  vehicle: Vehicle;
  customerComplaint: string;
  diagnosis?: string | null;
  workPerformed?: string | null;
  laborHours: number;
  mechanicNotes?: string | null;
  status: string;
  photoBefore?: string | null;
  photoAfter?: string | null;
  completedAt?: string | null;
  parts: { id: string; name: string; quantity: number; unitPrice: number }[];
};

type Invoice = {
  id: string;
  number: string;
  customer: Customer;
  type: string;
  laborCost: number;
  partsCost: number;
  discount: number;
  vatRate: number;
  total: number;
  status: string;
  issuedAt: string;
  items: { id: string; description: string; quantity: number; unitPrice: number }[];
};

type Part = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  lowStockAt: number;
};

type Reminder = {
  id: string;
  vehicle?: Vehicle & { customer: Customer };
  type: string;
  dueAt: string;
  message: string;
  done: boolean;
};

type Inspection = {
  id: string;
  reportNumber: string;
  package: { id: string; name: string; description: string; basePrice: number; checklist: string };
  vehicle: Vehicle & { customer: Customer };
  notes?: string | null;
  recommendation?: string | null;
  estimatedCost: number;
  items: { id: string; label: string; status: string; notes?: string | null }[];
};

type InspectionPackage = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  checklist: string;
};

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type BookingRequest = {
  id: string;
  customerName: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  serviceType: string;
  message?: string | null;
  gdprConsent: boolean;
  vehicleBrand: string;
  vehicleModel: string;
  licensePlate: string;
  mileage: number;
  status: string;
  createdAt: string;
};

type CompanySettings = {
  companyName: string;
  logoDataUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  vatRate: number;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  openingHours?: string | null;
  weekendAvailability: boolean;
};

type UserRole = "Admin" | "Mechanic" | "Reception";
type CreateKind = "customer" | "vehicle" | "appointment" | "order" | "invoice" | "part" | "reminder" | "inspection" | "staff";

export type AppData = {
  customers: Customer[];
  vehicles: Vehicle[];
  appointments: Appointment[];
  todayAppointments: Appointment[];
  workOrders: WorkOrder[];
  invoices: Invoice[];
  parts: Part[];
  reminders: Reminder[];
  inspections: Inspection[];
  packages: InspectionPackage[];
  bookingRequests: BookingRequest[];
  staff: StaffUser[];
  settings: CompanySettings;
  metrics: {
    openWorkOrders: number;
    completedToday: number;
    monthlyRevenue: number;
    workshopVehicles: string[];
  };
};

const modules = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "checkin", label: "Check-in", icon: PenLine },
  { id: "customers", label: "Kunden", icon: Users },
  { id: "vehicles", label: "Fahrzeuge", icon: Car },
  { id: "calendar", label: "Kalender", icon: CalendarDays },
  { id: "orders", label: "Aufträge", icon: ClipboardList },
  { id: "billing", label: "Angebote & Rechnungen", icon: FileText },
  { id: "inventory", label: "Lager", icon: Package },
  { id: "reminders", label: "Erinnerungen", icon: Bell },
  { id: "communication", label: "Kommunikation", icon: Phone },
  { id: "reports", label: "Reports", icon: BadgeEuro },
  { id: "inspection", label: "Inspektionspakete", icon: ClipboardCheck },
  { id: "settings", label: "Admin Export", icon: Download },
  { id: "roles", label: "Rollen", icon: ShieldCheck }
] as const;

const roleModules: Record<UserRole, (typeof modules)[number]["id"][]> = {
  Admin: ["dashboard", "checkin", "customers", "vehicles", "calendar", "orders", "billing", "inventory", "reminders", "communication", "reports", "inspection", "settings", "roles"],
  Mechanic: ["dashboard", "checkin", "orders", "vehicles", "inventory", "inspection", "reminders"],
  Reception: ["dashboard", "checkin", "customers", "vehicles", "calendar", "communication", "billing", "reminders"]
};

const dbRoleToUiRole: Record<string, UserRole> = {
  ADMIN: "Admin",
  MECHANIC: "Mechanic",
  RECEPTION: "Reception"
};

const statusLabel: Record<string, string> = {
  ANGEFRAGT: "angefragt",
  ABGELEHNT: "abgelehnt",
  KONVERTIERT: "Auftrag erstellt",
  BESTAETIGT: "bestätigt",
  STORNIERT: "storniert",
  ABGESCHLOSSEN: "abgeschlossen",
  GEPLANT: "geplant",
  ANGENOMMEN: "angenommen",
  DIAGNOSE_LAEUFT: "Diagnose läuft",
  WARTET_AUF_TEILE: "wartet auf Teile",
  IN_ARBEIT: "in Arbeit",
  FERTIG: "fertig",
  BEZAHLT: "bezahlt",
  ABGEHOLT: "abgeholt",
  UNBEZAHLT: "unbezahlt",
  OFFEN: "offen",
  TEILZAHLUNG: "Teilzahlung",
  TEILWEISE_BEZAHLT: "teilweise bezahlt",
  OK: "OK",
  ACHTUNG: "Achtung",
  DEFEKT: "Defekt",
  NICHT_GEPRUEFT: "Nicht geprüft",
  ADMIN: "Admin",
  MECHANIC: "Mechaniker",
  RECEPTION: "Annahme"
};

const badgeTone: Record<string, string> = {
  OK: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  BEZAHLT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  FERTIG: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  ABGEHOLT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  ACHTUNG: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  TEILZAHLUNG: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  ANGEFRAGT: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  KONVERTIERT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  ABGELEHNT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  BESTAETIGT: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  DEFEKT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  UNBEZAHLT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  OFFEN: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  TEILWEISE_BEZAHLT: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
};

const workOrderFlow = [
  "geplant",
  "angenommen",
  "Diagnose läuft",
  "wartet auf Teile",
  "in Arbeit",
  "fertig",
  "bezahlt",
  "abgeholt"
];

export function WorkshopApp({ data }: { data: AppData }) {
  const [appData, setAppData] = useState<AppData>(data);
  const [active, setActive] = useState<(typeof modules)[number]["id"]>("dashboard");
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");
  const [createKind, setCreateKind] = useState<CreateKind | null>(null);
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>(
    Object.fromEntries(appData.workOrders.map((order) => [order.id, order.status]))
  );
  const [checkedInVehicles, setCheckedInVehicles] = useState<Record<string, boolean>>({});

  const visibleModules = role ? modules.filter((module) => roleModules[role].includes(module.id)) : modules;
  const currentModule = visibleModules.find((module) => module.id === active) ?? visibleModules[0] ?? modules[0];
  const updateOrderStatus = (orderId: string, status: string) => {
    setOrderStatuses((current) => ({ ...current, [orderId]: status }));
    fetch("/api/records", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "order", id: orderId, values: { status } })
    })
      .then(() => refreshData())
      .catch(() => setError("Status konnte nicht gespeichert werden."));
  };

  const refreshData = async () => {
    const response = await fetch("/api/data", { cache: "no-store" });
    if (response.ok) {
      const nextData = (await response.json()) as AppData;
      setAppData(nextData);
      setOrderStatuses(Object.fromEntries(nextData.workOrders.map((order) => [order.id, order.status])));
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const [meResponse, statusResponse] = await Promise.all([fetch("/api/auth/me"), fetch("/api/auth/status")]);
        const me = await meResponse.json();
        const status = await statusResponse.json();
        if (me.user?.role) {
          setRole(dbRoleToUiRole[me.user.role] ?? "Reception");
          await refreshData();
        }
        setNeedsSetup(!status.hasUsers);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, []);

  const addRecord = async (kind: CreateKind, values: Record<string, string>) => {
    setError("");
    const response = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, values })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "Speichern fehlgeschlagen." }));
      setError(result.error || "Speichern fehlgeschlagen.");
      return;
    }
    await refreshData();
    setCreateKind(null);
  };

  const saveSettings = async (values: Record<string, string>) => {
    setError("");
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "Einstellungen konnten nicht gespeichert werden." }));
      setError(result.error || "Einstellungen konnten nicht gespeichert werden.");
      return;
    }
    await refreshData();
  };

  const deleteRecord = async (kind: CreateKind, id: string) => {
    setError("");
    const response = await fetch(`/api/records?kind=${kind}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "Löschen fehlgeschlagen." }));
      setError(result.error || "Löschen fehlgeschlagen.");
      return;
    }
    await refreshData();
  };

  const handleBookingRequest = async (id: string, action: "confirm" | "reject" | "convert") => {
    setError("");
    const response = await fetch("/api/booking/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "Terminanfrage konnte nicht verarbeitet werden." }));
      setError(result.error || "Terminanfrage konnte nicht verarbeitet werden.");
      return;
    }
    await refreshData();
  };

  const lowerQuery = query.toLowerCase();
  const filteredCustomers = appData.customers.filter((customer) =>
    [customer.name, customer.phone, customer.email, customer.address, ...customer.vehicles.map((vehicle) => vehicle.licensePlate)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(lowerQuery)
  );
  const filteredVehicles = appData.vehicles.filter((vehicle) =>
    [vehicle.brand, vehicle.model, vehicle.licensePlate, vehicle.vin, vehicle.customer?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(lowerQuery)
  );
  const filteredOrders = appData.workOrders.filter((order) =>
    [order.number, order.customer.name, order.vehicle.licensePlate, order.customerComplaint, orderStatuses[order.id] ?? order.status]
      .join(" ")
      .toLowerCase()
      .includes(lowerQuery)
  );

  const report = useMemo(() => {
    const openInvoices = appData.invoices.filter((invoice) => invoice.status !== "BEZAHLT");
    const partsProfit = appData.parts.reduce((sum, part) => sum + (part.sellingPrice - part.purchasePrice) * part.quantity, 0);
    const bestCustomers = [...appData.customers]
      .map((customer) => ({
        name: customer.name,
        revenue: appData.invoices
          .filter((invoice) => invoice.customer.id === customer.id)
          .reduce((sum, invoice) => sum + invoice.total, 0)
      }))
      .sort((a, b) => b.revenue - a.revenue);
    return { openInvoices, partsProfit, bestCustomers };
  }, [appData]);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "werkstattplan-export.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const ModuleIcon = currentModule.icon ?? Gauge;

  if (!authChecked) {
    return (
      <main className={clsx(dark && "dark")}>
        <div className="premium-shell grid min-h-screen place-items-center text-ink dark:text-slate-100">
          <div className="premium-card rounded-md p-6 text-sm font-black uppercase tracking-[0.16em] text-steel">WerkstattPlan wird geladen</div>
        </div>
      </main>
    );
  }

  if (!role) {
    return (
      <LoginScreen
        dark={dark}
        setDark={setDark}
        needsSetup={needsSetup}
        onAuthenticated={async (nextRole) => {
          setRole(nextRole);
          setActive("dashboard");
          setNeedsSetup(false);
          await refreshData();
        }}
      />
    );
  }

  return (
    <main className={clsx(dark && "dark")}>
      <div className="premium-shell min-h-screen text-ink transition-colors dark:text-slate-100">
        <header className="sticky top-0 z-40 border-b border-black/10 bg-white/80 shadow-[0_10px_35px_rgba(16,24,32,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0d131b]/90">
          <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6">
            <button
              className="rounded-md border border-slate-200 bg-white/80 p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-signal dark:border-white/10 dark:bg-white/5 lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Navigation öffnen"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Brand />
            <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-steel shadow-sm dark:border-white/10 dark:bg-white/5 md:flex">
              <UserRound className="h-4 w-4 text-signal" />
              {role}
            </div>
            <div className="ml-auto hidden min-w-[280px] max-w-md flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white/80 px-3 py-2 shadow-inner transition focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/10 dark:border-white/10 dark:bg-white/5 md:flex">
              <Search className="h-4 w-4 text-steel" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Kunde, Kennzeichen, Auftrag suchen"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={exportData}
              className="hidden rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-graphite shadow-sm transition hover:-translate-y-0.5 hover:border-signal hover:text-signal dark:border-white/10 dark:bg-white/5 dark:text-slate-200 sm:inline-flex"
            >
              Export
            </button>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                setRole(null);
              }}
              className="hidden rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-graphite shadow-sm transition hover:-translate-y-0.5 hover:border-signal hover:text-signal dark:border-white/10 dark:bg-white/5 dark:text-slate-200 sm:inline-flex"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDark((value) => !value)}
              className="rounded-md bg-ink p-2 text-white shadow-lg shadow-ink/20 transition hover:-translate-y-0.5 hover:bg-signal dark:bg-white dark:text-ink dark:shadow-white/10"
              aria-label="Darstellung wechseln"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <div className="border-t border-slate-200 px-4 py-2 dark:border-white/10 md:hidden">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-white/5">
              <Search className="h-4 w-4 text-steel" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Schnellsuche"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[280px_1fr]">
          <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] border-r border-black/10 bg-white/75 px-4 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d131b]/80 lg:block">
            <Navigation active={active} setActive={setActive} modules={visibleModules} />
          </aside>

          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 lg:hidden">
              <div className="h-full w-[86vw] max-w-sm bg-white p-4 shadow-premium dark:bg-[#111821]">
                <div className="mb-4 flex items-center justify-between">
                  <Brand compact />
                  <button className="rounded-md border border-slate-200 p-2 dark:border-white/10" onClick={() => setMobileNavOpen(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <Navigation
                  modules={visibleModules}
                  active={active}
                  setActive={(module) => {
                    setActive(module);
                    setMobileNavOpen(false);
                  }}
                />
              </div>
            </div>
          )}

          <section className="px-4 py-5 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
                {error}
              </div>
            )}
            <div className="animated-enter mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-signal">
                  <ModuleIcon className="h-4 w-4" />
                  Werkstattsteuerung
                </div>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{currentModule.label}</h1>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-steel">
                <span className="rounded-md border border-slate-200 bg-white/80 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
                  {appData.customers.length} Kunden
                </span>
                <span className="rounded-md border border-slate-200 bg-white/80 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
                  {appData.vehicles.length} Fahrzeuge
                </span>
                <span className="rounded-md border border-slate-200 bg-white/80 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
                  {appData.workOrders.length} Aufträge
                </span>
              </div>
            </div>

            {active === "dashboard" && (
              <Dashboard
                data={appData}
                role={role}
                setActive={setActive}
                orderStatuses={orderStatuses}
                onStatusChange={updateOrderStatus}
                onBookingAction={handleBookingRequest}
              />
            )}
            {active === "checkin" && (
              <CheckInScreen
                data={appData}
                checkedInVehicles={checkedInVehicles}
                onCheckIn={(vehicleId) => setCheckedInVehicles((current) => ({ ...current, [vehicleId]: true }))}
                onCreate={() => setCreateKind("vehicle")}
              />
            )}
            {active === "customers" && <Customers customers={filteredCustomers} onCreate={() => setCreateKind("customer")} onDelete={(id) => deleteRecord("customer", id)} />}
            {active === "vehicles" && <Vehicles vehicles={filteredVehicles} onCreate={() => setCreateKind("vehicle")} onDelete={(id) => deleteRecord("vehicle", id)} />}
            {active === "calendar" && <Calendar appointments={appData.appointments} onCreate={() => setCreateKind("appointment")} />}
            {active === "orders" && <WorkOrders orders={filteredOrders} orderStatuses={orderStatuses} onStatusChange={updateOrderStatus} onCreate={() => setCreateKind("order")} onDelete={(id) => deleteRecord("order", id)} />}
            {active === "billing" && <Billing invoices={appData.invoices} onCreate={() => setCreateKind("invoice")} onDelete={(id) => deleteRecord("invoice", id)} />}
            {active === "inventory" && <Inventory parts={appData.parts} onCreate={() => setCreateKind("part")} onDelete={(id) => deleteRecord("part", id)} />}
            {active === "reminders" && <Reminders reminders={appData.reminders} onCreate={() => setCreateKind("reminder")} onDelete={(id) => deleteRecord("reminder", id)} />}
            {active === "communication" && <Communication customers={filteredCustomers} onCreate={() => setCreateKind("customer")} />}
            {active === "reports" && <Reports data={appData} report={report} onCreate={() => setCreateKind("invoice")} />}
            {active === "inspection" && <InspectionModule inspections={appData.inspections} packages={appData.packages} onCreate={() => setCreateKind("inspection")} />}
            {active === "settings" && <AdminSettings settings={appData.settings} onSave={saveSettings} />}
            {active === "roles" && <Roles staff={appData.staff} onCreate={() => setCreateKind("staff")} onDelete={(id) => deleteRecord("staff", id)} />}
          </section>
        </div>
        {createKind && <CreateDialog kind={createKind} onClose={() => setCreateKind(null)} onSubmit={(values) => addRecord(createKind, values)} />}
      </div>
    </main>
  );
}

function LoginScreen({
  dark,
  setDark,
  needsSetup,
  onAuthenticated
}: {
  dark: boolean;
  setDark: (value: boolean) => void;
  needsSetup: boolean;
  onAuthenticated: (role: UserRole) => void;
}) {
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const roles: { role: UserRole; title: string; focus: string; icon: ComponentType<{ className?: string }> }[] = [
    { role: "Admin", title: "Geschäftsführung", focus: "Umsatz, Auslastung, Belege, Rollen", icon: ShieldCheck },
    { role: "Mechanic", title: "Werkstatt", focus: "Aktive Jobs, Status, Checklisten, Teile", icon: Wrench },
    { role: "Reception", title: "Annahme", focus: "Termine, Check-in, Kunden, Kommunikation", icon: Users }
  ];

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch(needsSetup ? "/api/auth/setup" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setFormError(result.error || "Anmeldung fehlgeschlagen.");
      return;
    }
    onAuthenticated(dbRoleToUiRole[result.user.role] ?? "Reception");
  };

  return (
    <main className={clsx(dark && "dark")}>
      <div className="premium-shell grid min-h-screen place-items-center px-4 py-8 text-ink dark:text-slate-100">
        <section className="animated-enter grid w-full max-w-6xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="premium-card rounded-md p-6 sm:p-8">
            <div className="card-body flex h-full flex-col justify-between gap-10">
              <div>
                <Brand />
                <div className="mt-10 inline-flex items-center gap-2 rounded-md border border-signal/20 bg-signal/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-signal">
                  <Sparkles className="h-3.5 w-3.5" />
                  Dealership Console
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">WerkstattPlan</h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-steel">
                  Minimalistische Rollenoberfläche für Annahme, Werkstatt und Verwaltung mit schnellen Touch-Aktionen.
                </p>
              </div>
              <button
                onClick={() => setDark(!dark)}
                className="touch-button w-fit rounded-md border border-slate-200 bg-white/70 px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:border-signal dark:border-white/10 dark:bg-white/5"
              >
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                Darstellung wechseln
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            <form className="premium-card rounded-md p-5" onSubmit={submitAuth}>
              <div className="card-body">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-signal">
                  {needsSetup ? "Ersteinrichtung" : "Sicherer Login"}
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  {needsSetup ? "Ersten Admin anlegen" : "Mit E-Mail und Passwort anmelden"}
                </h2>
                <div className="mt-5 grid gap-3">
                  {needsSetup && (
                    <>
                      <label className="text-sm font-bold text-steel">
                        Firmenname
                        <input name="companyName" defaultValue="KFZ Agani" className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" required />
                      </label>
                      <LogoUploadField />
                      <label className="text-sm font-bold text-steel">
                        Adresse
                        <input name="address" className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      </label>
                      <label className="text-sm font-bold text-steel">
                        Telefon
                        <input name="phone" className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      </label>
                      <label className="text-sm font-bold text-steel">
                        Firmen-E-Mail
                        <input name="companyEmail" type="email" className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      </label>
                      <label className="text-sm font-bold text-steel">
                        Website
                        <input name="website" className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      </label>
                      <label className="text-sm font-bold text-steel">
                        Steuernummer
                        <input name="taxNumber" className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      </label>
                      <label className="text-sm font-bold text-steel">
                        MwSt. %
                        <input name="vatRate" type="number" defaultValue="19" className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      </label>
                      <label className="text-sm font-bold text-steel">
                        Rechnungspräfix
                        <input name="invoicePrefix" defaultValue="RE" className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      </label>
                      <label className="text-sm font-bold text-steel">
                        Öffnungszeiten
                        <input name="openingHours" placeholder="Mo-Fr ab 17:00, Sa nach Vereinbarung" className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      </label>
                      <label className="flex items-center gap-3 text-sm font-bold text-steel">
                        <input name="weekendAvailability" type="checkbox" defaultChecked className="h-5 w-5" />
                        Wochenendtermine anbieten
                      </label>
                      <label className="text-sm font-bold text-steel">
                        Admin Name
                        <input name="name" className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" required />
                      </label>
                    </>
                  )}
                  <label className="text-sm font-bold text-steel">
                    E-Mail
                    <input name="email" type="email" className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" required />
                  </label>
                  <label className="text-sm font-bold text-steel">
                    Passwort
                    <input name="password" type="password" minLength={8} className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" required />
                  </label>
                </div>
                {formError && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-100">{formError}</div>}
                <button className="touch-button mt-5 w-full rounded-md bg-ink px-5 py-3 text-sm font-black text-white shadow-lg shadow-ink/20 transition hover:bg-signal dark:bg-white dark:text-ink" disabled={busy}>
                  {busy ? "Bitte warten" : needsSetup ? "Admin erstellen" : "Einloggen"}
                </button>
              </div>
            </form>
            {roles.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.role}
                  className={clsx("animated-enter premium-card group rounded-md p-5 text-left", index === 1 && "stagger-1", index === 2 && "stagger-2")}
                >
                  <div className="card-body flex items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-md bg-ink text-white shadow-lg shadow-ink/20 transition group-hover:scale-105 dark:bg-white dark:text-ink">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-steel">{item.title}</div>
                        <div className="mt-1 text-2xl font-black tracking-tight">{item.role}</div>
                        <div className="mt-1 text-sm text-steel">{item.focus}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="scan-line grid h-11 w-11 place-items-center rounded-md bg-ink text-white shadow-premium ring-1 ring-white/20 dark:bg-white dark:text-ink">
        <Wrench className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className="truncate text-lg font-black leading-5 tracking-tight">WerkstattPlan</div>
          <div className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-steel">by KFZ Agani</div>
        </div>
      )}
    </div>
  );
}

function Navigation({
  active,
  setActive,
  modules: visibleModules
}: {
  active: (typeof modules)[number]["id"];
  setActive: (module: (typeof modules)[number]["id"]) => void;
  modules: readonly (typeof modules)[number][];
}) {
  return (
    <nav className="space-y-1">
      {visibleModules.map((module) => {
        const Icon = module.icon;
        return (
          <button
            key={module.id}
            onClick={() => setActive(module.id)}
            className={clsx(
              "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition duration-200 hover:-translate-y-0.5",
              active === module.id
                ? "nav-indicator bg-ink text-white shadow-lg shadow-ink/20 dark:bg-white dark:text-ink dark:shadow-white/10"
                : "text-graphite hover:bg-white/80 hover:shadow-sm dark:text-slate-200 dark:hover:bg-white/10"
            )}
          >
            <Icon className="h-4 w-4 shrink-0 transition group-hover:scale-110" />
            <span>{module.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="animated-enter premium-card rounded-md p-8 text-center">
      <div className="card-body mx-auto max-w-xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-md bg-ink text-white shadow-lg shadow-ink/20 dark:bg-white dark:text-ink">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-steel">{description}</p>
        <button
          onClick={onAction}
          className="touch-button mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-black text-white shadow-lg shadow-ink/20 transition hover:-translate-y-0.5 hover:bg-signal dark:bg-white dark:text-ink"
        >
          {action}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function CreateDialog({
  kind,
  onClose,
  onSubmit
}: {
  kind: CreateKind;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const config: Record<CreateKind, { title: string; fields: { name: string; label: string; type?: string }[] }> = {
    customer: {
      title: "Neuen Kunden anlegen",
      fields: [
        { name: "name", label: "Name" },
        { name: "phone", label: "Telefon" },
        { name: "whatsapp", label: "WhatsApp" },
        { name: "email", label: "E-Mail", type: "email" },
        { name: "address", label: "Adresse" },
        { name: "notes", label: "Notizen" }
      ]
    },
    vehicle: {
      title: "Neues Fahrzeug hinzufügen",
      fields: [
        { name: "customerName", label: "Kunde" },
        { name: "phone", label: "Telefon" },
        { name: "brand", label: "Marke" },
        { name: "model", label: "Modell" },
        { name: "licensePlate", label: "Kennzeichen" },
        { name: "vin", label: "VIN" },
        { name: "mileage", label: "Kilometer", type: "number" },
        { name: "year", label: "Baujahr", type: "number" },
        { name: "fuelType", label: "Kraftstoff" }
      ]
    },
    appointment: {
      title: "Neuen Termin erstellen",
      fields: [
        { name: "title", label: "Terminart" },
        { name: "startsAt", label: "Datum/Uhrzeit", type: "datetime-local" },
        { name: "notes", label: "Notizen" }
      ]
    },
    order: {
      title: "Neuen Auftrag erstellen",
      fields: [
        { name: "number", label: "Auftragsnummer" },
        { name: "customerComplaint", label: "Kundenbeanstandung" }
      ]
    },
    invoice: {
      title: "Neue Rechnung erstellen",
      fields: [
        { name: "number", label: "Belegnummer" },
        { name: "type", label: "Typ" },
        { name: "total", label: "Gesamtbetrag", type: "number" }
      ]
    },
    part: {
      title: "Neues Teil anlegen",
      fields: [
        { name: "name", label: "Teilename" },
        { name: "sku", label: "SKU" },
        { name: "quantity", label: "Bestand", type: "number" },
        { name: "purchasePrice", label: "Einkaufspreis", type: "number" },
        { name: "sellingPrice", label: "Verkaufspreis", type: "number" }
      ]
    },
    reminder: {
      title: "Neue Erinnerung erstellen",
      fields: [
        { name: "type", label: "Typ" },
        { name: "dueAt", label: "Fällig am", type: "date" },
        { name: "message", label: "Nachricht" }
      ]
    },
    inspection: {
      title: "Neues Inspektionspaket erstellen",
      fields: [
        { name: "name", label: "Paketname" },
        { name: "description", label: "Beschreibung" },
        { name: "basePrice", label: "Basispreis", type: "number" }
      ]
    },
    staff: {
      title: "Neuen Benutzer anlegen",
      fields: [
        { name: "name", label: "Name" },
        { name: "email", label: "E-Mail", type: "email" },
        { name: "role", label: "Rolle" }
      ]
    }
  };
  const current = config[kind];

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 px-4 backdrop-blur-sm">
      <form
        className="animated-enter premium-card max-h-[90vh] w-full max-w-2xl overflow-auto rounded-md p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onSubmit(Object.fromEntries(formData.entries()) as Record<string, string>);
        }}
      >
        <div className="card-body">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-signal">Echte Dateneingabe</div>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{current.title}</h2>
            </div>
            <button type="button" onClick={onClose} className="rounded-md border border-slate-200 p-2 dark:border-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {current.fields.map((field) => (
              <label key={field.name} className="text-sm font-bold text-steel">
                {field.label}
                <input
                  name={field.name}
                  type={field.type ?? "text"}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className="touch-button rounded-md border border-slate-200 px-5 py-3 text-sm font-black dark:border-white/10">
              Abbrechen
            </button>
            <button className="touch-button rounded-md bg-ink px-5 py-3 text-sm font-black text-white shadow-lg shadow-ink/20 transition hover:bg-signal dark:bg-white dark:text-ink">
              Speichern
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Dashboard({
  data,
  role,
  setActive,
  orderStatuses,
  onStatusChange,
  onBookingAction
}: {
  data: AppData;
  role: UserRole;
  setActive: (module: (typeof modules)[number]["id"]) => void;
  orderStatuses: Record<string, string>;
  onStatusChange: (orderId: string, status: string) => void;
  onBookingAction: (id: string, action: "confirm" | "reject" | "convert") => void;
}) {
  const openInvoices = data.invoices.filter((invoice) => invoice.status !== "BEZAHLT").length;
  const lowStock = data.parts.filter((part) => part.quantity <= part.lowStockAt).length;
  const activeOrders = data.workOrders.filter((order) => ["DIAGNOSE_LAEUFT", "WARTET_AUF_TEILE", "IN_ARBEIT"].includes(orderStatuses[order.id] ?? order.status)).length;
  const isCleanInstall =
    data.customers.length === 0 &&
    data.vehicles.length === 0 &&
    data.appointments.length === 0 &&
    data.workOrders.length === 0 &&
    data.invoices.length === 0 &&
    data.bookingRequests.length === 0;

  if (isCleanInstall) {
    return (
      <EmptyState
        icon={Gauge}
        title={`${role} Dashboard ist bereit`}
        description="WerkstattPlan enthält keine Demo-Daten mehr. Starten Sie mit echten KFZ Agani Kunden, Fahrzeugen und Aufträgen."
        action={role === "Mechanic" ? "Fahrzeug Check-in öffnen" : role === "Reception" ? "Neuen Kunden anlegen" : "Erste Daten erfassen"}
        onAction={() => setActive(role === "Mechanic" ? "checkin" : "customers")}
      />
    );
  }
  const stats = [
    {
      label: "Heutige Termine",
      value: data.todayAppointments.length,
      icon: CalendarDays,
      detail: "Annahme & Übergabe",
      trend: "+2 Slots frei",
      progress: 66
    },
    {
      label: "Offene Aufträge",
      value: data.metrics.openWorkOrders,
      icon: ClipboardList,
      detail: `${activeOrders} aktiv in Bearbeitung`,
      trend: "Werkstatt läuft",
      progress: 78
    },
    {
      label: "Heute fertig",
      value: data.metrics.completedToday,
      icon: CheckCircle2,
      detail: "Abgeschlossen & dokumentiert",
      trend: "Qualitätscheck",
      progress: 48
    },
    {
      label: "Monatsumsatz",
      value: currency.format(data.metrics.monthlyRevenue),
      icon: BadgeEuro,
      detail: `${openInvoices} offene Belege`,
      trend: "Netto im Blick",
      progress: 57
    }
  ];

  if (role === "Mechanic") {
    return <MechanicDashboard data={data} orderStatuses={orderStatuses} onStatusChange={onStatusChange} setActive={setActive} />;
  }

  if (role === "Reception") {
    return <ReceptionDashboard data={data} setActive={setActive} />;
  }

  return (
    <div className="space-y-5">
      <section className="animated-enter premium-card rounded-md p-4 sm:p-5">
        <div className="card-body grid gap-5 xl:grid-cols-[1.25fr_0.75fr] xl:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-signal/20 bg-signal/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-signal">
              <Sparkles className="h-3.5 w-3.5" />
              Service Command Center
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-4xl">KFZ Agani Tagessteuerung</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
              Alle aktiven Vorgänge, Termine, Erinnerungen und Belege auf einer präzisen Werkstattansicht.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <StatusPill label="Werkstattplätze" value={`${data.metrics.workshopVehicles.length} belegt`} />
            <StatusPill label="Teilewarnung" value={`${lowStock} niedrig`} />
            <StatusPill label="Zahlung" value={`${openInvoices} offen`} />
            <StatusPill label="Prüfberichte" value={`${data.inspections.length} aktiv`} />
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <KpiCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      <OperationsStrip data={data} />

      <BookingRequestsPanel requests={data.bookingRequests} onAction={onBookingAction} />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <Panel title="Heute in der Annahme" action={`${data.todayAppointments.length} Termine`}>
          <div className="space-y-3">
            {data.todayAppointments.map((appointment) => (
              <Row key={appointment.id}>
                <div>
                  <div className="font-bold">{formatTime(appointment.startsAt)} - {appointment.title}</div>
                  <div className="text-sm text-steel">
                    {appointment.customer.name} · {appointment.vehicle.licensePlate} · {appointment.vehicle.brand} {appointment.vehicle.model}
                  </div>
                </div>
                <Badge value={appointment.status} />
              </Row>
            ))}
          </div>
        </Panel>
        <Panel title="Fahrzeuge in der Werkstatt" action={`${data.metrics.workshopVehicles.length} aktiv`}>
          <div className="space-y-2">
            {data.metrics.workshopVehicles.map((vehicle) => (
              <div key={vehicle} className="scan-line rounded-md border border-slate-200 bg-slate-100 px-3 py-3 text-sm font-semibold shadow-sm dark:border-white/10 dark:bg-white/10">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-signal" />
                  <span>{vehicle}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Anstehende Erinnerungen" action="TÜV, Öl, Bremsen">
        <ReminderGrid reminders={data.reminders} />
      </Panel>
    </div>
  );
}

function KpiCard({
  stat,
  index
}: {
  stat: {
    label: string;
    value: string | number;
    icon: ComponentType<{ className?: string }>;
    detail: string;
    trend: string;
    progress: number;
  };
  index: number;
}) {
  const Icon = stat.icon;
  return (
    <article className={clsx("animated-enter kpi-card premium-card rounded-md p-4", index === 1 && "stagger-1", index === 2 && "stagger-2", index === 3 && "stagger-3")}>
      <div className="card-body flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-steel">{stat.label}</span>
            <div className="mt-3 text-3xl font-black tracking-tight">{stat.value}</div>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-md bg-ink text-white shadow-lg shadow-ink/20 dark:bg-white dark:text-ink">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold text-graphite dark:text-slate-200">{stat.detail}</p>
        <div className="mt-auto pt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-steel">
            <span>{stat.trend}</span>
            <span>{stat.progress}%</span>
          </div>
          <div className="metric-track">
            <div className="metric-fill" style={{ width: `${stat.progress}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}

function OperationsStrip({ data }: { data: AppData }) {
  const lanes = [
    { label: "Annahme", value: data.todayAppointments.length, helper: "Termine heute" },
    { label: "Diagnose", value: data.workOrders.filter((order) => order.status === "DIAGNOSE_LAEUFT").length, helper: "laufend" },
    { label: "Teile", value: data.workOrders.filter((order) => order.status === "WARTET_AUF_TEILE").length, helper: "wartend" },
    { label: "Auslieferung", value: data.workOrders.filter((order) => ["FERTIG", "BEZAHLT"].includes(order.status)).length, helper: "bereit" }
  ];

  return (
    <section className="animated-enter stagger-2 grid gap-3 md:grid-cols-4">
      {lanes.map((lane) => (
        <div key={lane.label} className="premium-card rounded-md p-3">
          <div className="card-body flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-steel">{lane.label}</div>
              <div className="mt-1 text-sm font-semibold text-graphite dark:text-slate-200">{lane.helper}</div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-md bg-slate-100 text-xl font-black dark:bg-white/10">
              {lane.value}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function BookingRequestsPanel({
  requests,
  onAction
}: {
  requests: BookingRequest[];
  onAction: (id: string, action: "confirm" | "reject" | "convert") => void;
}) {
  const openRequests = requests.filter((request) => request.status === "ANGEFRAGT");
  const recentRequests = openRequests.length > 0 ? openRequests : requests.slice(0, 3);

  return (
    <Panel title="Neue Terminanfragen" action={`${openRequests.length} neu`}>
      {recentRequests.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white/50 p-5 text-sm font-semibold text-steel dark:border-white/15 dark:bg-white/5">
          Keine neuen Terminanfragen. Öffentliche Anfragen über /booking erscheinen hier sofort.
        </div>
      ) : (
        <div className="space-y-3">
          {recentRequests.map((request) => {
            const contactNumber = request.whatsapp || request.phone;
            const vehicle = `${request.vehicleBrand} ${request.vehicleModel}${request.licensePlate ? ` · ${request.licensePlate}` : ""}`;
            const message = `Hallo ${request.customerName}, vielen Dank fuer Ihre Terminanfrage bei KFZ Agani (${request.serviceType}). Wir melden uns zur Bestaetigung.`;
            return (
              <Row key={request.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black">{request.customerName}</h3>
                    <Badge value={request.status} />
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-steel dark:bg-white/10">{request.serviceType}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-graphite dark:text-slate-200">{vehicle}</div>
                  <div className="mt-1 text-sm text-steel">
                    {request.preferredDate ? formatDate(request.preferredDate) : "Wunschtermin offen"}
                    {request.preferredTime ? ` · ${request.preferredTime} Uhr` : ""}
                    {request.mileage ? ` · ${number.format(request.mileage)} km` : ""}
                  </div>
                  {request.message && <p className="mt-2 line-clamp-2 text-sm text-steel">{request.message}</p>}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[260px]">
                  <a
                    href={whatsappLink(contactNumber, message)}
                    target="_blank"
                    rel="noreferrer"
                    className="touch-button inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-3 text-sm font-black transition hover:border-emerald-500 hover:text-emerald-700 dark:border-white/10"
                  >
                    <Phone className="h-4 w-4" />
                    WhatsApp
                  </a>
                  {request.status === "ANGEFRAGT" && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button onClick={() => onAction(request.id, "confirm")} className="touch-button rounded-md bg-ink px-3 py-3 text-sm font-black text-white shadow-lg shadow-ink/20 transition hover:bg-signal dark:bg-white dark:text-ink">
                        Bestätigen
                      </button>
                      <button onClick={() => onAction(request.id, "reject")} className="touch-button rounded-md border border-slate-200 px-3 py-3 text-sm font-black transition hover:border-red-500 hover:text-red-600 dark:border-white/10">
                        Ablehnen
                      </button>
                      <button onClick={() => onAction(request.id, "convert")} className="touch-button inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-3 py-3 text-sm font-black transition hover:border-signal hover:text-signal dark:border-white/10">
                        Auftrag
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </Row>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-steel">{label}</div>
      <div className="mt-1 font-black">{value}</div>
    </div>
  );
}

function Customers({ customers, onCreate, onDelete }: { customers: Customer[]; onCreate: () => void; onDelete: (id: string) => void }) {
  if (customers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Noch keine Kunden angelegt"
        description="Starten Sie mit einem echten KFZ Agani Kundenprofil inklusive Kontakt, DSGVO-Status und Historie."
        action="Neuen Kunden anlegen"
        onAction={onCreate}
      />
    );
  }
  return (
    <Grid>
      {customers.map((customer) => (
        <article key={customer.id} className="animated-enter premium-card rounded-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">{customer.name}</h2>
              <p className="mt-1 text-sm text-steel">{customer.address || "Adresse nicht hinterlegt"}</p>
            </div>
            <span className={clsx("rounded-md px-2 py-1 text-xs font-bold", customer.gdprConsent ? badgeTone.OK : badgeTone.DEFEKT)}>
              DSGVO
            </span>
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <Info label="Telefon" value={customer.phone} />
            <Info label="WhatsApp" value={customer.whatsapp} />
            <Info label="E-Mail" value={customer.email || "-"} />
            <Info label="Historie" value={`${customer.vehicles.length} Fahrzeug(e), Notizen gepflegt`} />
          </dl>
          <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm text-graphite dark:bg-white/10 dark:text-slate-200">
            {customer.notes || "Keine Notizen"}
          </p>
          <button onClick={() => onDelete(customer.id)} className="touch-button mt-4 rounded-md border border-slate-200 px-3 py-2 text-sm font-black transition hover:border-red-500 hover:text-red-600 dark:border-white/10">
            Kunde löschen
          </button>
        </article>
      ))}
    </Grid>
  );
}

function Vehicles({ vehicles, onCreate, onDelete }: { vehicles: Vehicle[]; onCreate: () => void; onDelete: (id: string) => void }) {
  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="Noch keine Fahrzeuge erfasst"
        description="Legen Sie das erste echte Kundenfahrzeug mit Kennzeichen, VIN, Kilometerstand und Serviceinformationen an."
        action="Neues Fahrzeug hinzufügen"
        onAction={onCreate}
      />
    );
  }
  return (
    <Grid>
      {vehicles.map((vehicle) => (
        <article key={vehicle.id} className="animated-enter premium-card rounded-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">
                {vehicle.brand} {vehicle.model}
              </h2>
              <p className="mt-1 text-sm font-bold text-signal">{vehicle.licensePlate}</p>
            </div>
            <Car className="h-5 w-5 text-steel" />
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <Info label="Kunde" value={vehicle.customer?.name || "-"} />
            <Info label="VIN" value={vehicle.vin || "-"} />
            <Info label="Kilometer" value={`${number.format(vehicle.mileage)} km`} />
            <Info label="Motor" value={vehicle.engine || "-"} />
            <Info label="Baujahr" value={String(vehicle.year)} />
            <Info label="Kraftstoff" value={vehicle.fuelType} />
            <Info label="TÜV" value={formatDate(vehicle.tuvDate)} />
            <Info label="Letzter Ölservice" value={vehicle.lastOilService ? formatDate(vehicle.lastOilService) : "-"} />
            <Info label="Nächster Ölservice" value={vehicle.nextOilService ? formatDate(vehicle.nextOilService) : "-"} />
          </dl>
          <button onClick={() => onDelete(vehicle.id)} className="touch-button mt-4 rounded-md border border-slate-200 px-3 py-2 text-sm font-black transition hover:border-red-500 hover:text-red-600 dark:border-white/10">
            Fahrzeug löschen
          </button>
        </article>
      ))}
    </Grid>
  );
}

function Calendar({ appointments, onCreate }: { appointments: Appointment[]; onCreate: () => void }) {
  const weekdaySlots = ["17:00", "18:00", "19:00"];
  const weekendSlots = ["09:00", "10:30", "12:00"];
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Noch keine Termine geplant"
        description="Planen Sie den ersten echten Werkstatttermin. Werktagsslots ab 17:00 Uhr und Wochenenden bleiben vorbereitet."
        action="Neuen Termin erstellen"
        onAction={onCreate}
      />
    );
  }
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Panel title="Tages- und Wochenkalender" action="Slots ab 17:00">
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <Row key={appointment.id}>
              <div>
                <div className="font-bold">
                  {formatDate(appointment.startsAt)} · {formatTime(appointment.startsAt)}-{formatTime(appointment.endsAt)}
                </div>
                <div className="text-sm text-steel">
                  {appointment.title} · {appointment.customer.name} · {appointment.vehicle.licensePlate}
                </div>
              </div>
              <Badge value={appointment.status} />
            </Row>
          ))}
        </div>
      </Panel>
      <Panel title="Verfügbare Zeiten" action="Werkstattzeiten">
        <div className="space-y-4">
          <SlotGroup title="Werktags" slots={weekdaySlots} />
          <SlotGroup title="Wochenende" slots={weekendSlots} />
          <div className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-steel dark:border-white/15">
            Neue Termine starten als Anfrage und können danach bestätigt, storniert oder abgeschlossen werden.
          </div>
        </div>
      </Panel>
    </div>
  );
}

function WorkOrders({
  orders,
  orderStatuses,
  onStatusChange,
  onCreate,
  onDelete
}: {
  orders: WorkOrder[];
  orderStatuses: Record<string, string>;
  onStatusChange: (orderId: string, status: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  const fastStatuses = ["GEPLANT", "ANGENOMMEN", "DIAGNOSE_LAEUFT", "WARTET_AUF_TEILE", "IN_ARBEIT", "FERTIG", "BEZAHLT", "ABGEHOLT"];
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Noch keine Arbeitsaufträge"
        description="Erstellen Sie den ersten echten digitalen Auftrag für Diagnose, Teile, Arbeitszeit und Statusführung."
        action="Neuen Auftrag erstellen"
        onAction={onCreate}
      />
    );
  }
  return (
    <div className="space-y-5">
      <Panel title="Statusstrecke" action="Digitaler Auftrag">
        <div className="grid gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {workOrderFlow.map((step) => (
            <div key={step} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold dark:border-white/10 dark:bg-white/5">
              {step}
            </div>
          ))}
        </div>
      </Panel>
      <Grid>
        {orders.map((order) => {
          const status = orderStatuses[order.id] ?? order.status;
          return (
          <article key={order.id} className="animated-enter premium-card rounded-md p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black">{order.number}</h2>
                <p className="text-sm text-steel">{order.customer.name} · {order.vehicle.licensePlate}</p>
              </div>
              <Badge value={status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {fastStatuses.slice(2, 6).map((nextStatus) => (
                <button
                  key={nextStatus}
                  onClick={() => onStatusChange(order.id, nextStatus)}
                  className={clsx(
                    "touch-button rounded-md border px-3 py-3 text-xs font-black transition hover:-translate-y-0.5",
                    status === nextStatus
                      ? "border-signal bg-signal text-white shadow-lg shadow-signal/20"
                      : "border-slate-200 bg-white/70 hover:border-signal dark:border-white/10 dark:bg-white/5"
                  )}
                >
                  {statusLabel[nextStatus]}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <TextBlock label="Kundenbeanstandung" value={order.customerComplaint} />
              <TextBlock label="Diagnose" value={order.diagnosis || "Noch offen"} />
              <TextBlock label="Durchgeführte Arbeiten" value={order.workPerformed || "Noch offen"} />
              <TextBlock label="Mechaniker-Notizen" value={order.mechanicNotes || "Keine"} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md bg-slate-100 p-3 dark:bg-white/10">
                <div className="text-steel">Arbeitszeit</div>
                <div className="font-black">{order.laborHours} h</div>
              </div>
              <div className="rounded-md bg-slate-100 p-3 dark:bg-white/10">
                <div className="text-steel">Teile</div>
                <div className="font-black">{order.parts.length}</div>
              </div>
            </div>
            <button onClick={() => onDelete(order.id)} className="touch-button mt-4 rounded-md border border-slate-200 px-3 py-2 text-sm font-black transition hover:border-red-500 hover:text-red-600 dark:border-white/10">
              Auftrag löschen
            </button>
          </article>
          );
        })}
      </Grid>
    </div>
  );
}

function Billing({ invoices, onCreate, onDelete }: { invoices: Invoice[]; onCreate: () => void; onDelete: (id: string) => void }) {
  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Noch keine Angebote oder Rechnungen"
        description="Erstellen Sie den ersten echten Beleg mit KFZ Agani Branding, MwSt. und Zahlungsstatus."
        action="Neue Rechnung erstellen"
        onAction={onCreate}
      />
    );
  }
  return (
    <Grid>
      {invoices.map((invoice) => (
        <article key={invoice.id} className="animated-enter premium-card rounded-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black">{invoice.number}</h2>
              <p className="text-sm text-steel">{invoice.type} · {invoice.customer.name}</p>
            </div>
            <Badge value={invoice.status} />
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <Info label="Arbeitslohn" value={currency.format(invoice.laborCost)} />
            <Info label="Teile" value={currency.format(invoice.partsCost)} />
            <Info label="Rabatt" value={currency.format(invoice.discount)} />
            <Info label="MwSt." value={`${invoice.vatRate}%`} />
            <Info label="Gesamt" value={currency.format(invoice.total)} strong />
          </dl>
          <a
            href={`/api/pdf/invoice/${invoice.id}`}
            target="_blank"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-bold text-white dark:bg-white dark:text-ink"
          >
            <Download className="h-4 w-4" />
            PDF erstellen
          </a>
          <button onClick={() => onDelete(invoice.id)} className="touch-button mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-black transition hover:border-red-500 hover:text-red-600 dark:border-white/10">
            Beleg löschen
          </button>
        </article>
      ))}
    </Grid>
  );
}

function Inventory({ parts, onCreate, onDelete }: { parts: Part[]; onCreate: () => void; onDelete: (id: string) => void }) {
  if (parts.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Noch keine Teile im Lager"
        description="Legen Sie echte Ersatzteile mit SKU, Einkaufspreis, Verkaufspreis und Mindestbestand an."
        action="Neues Teil anlegen"
        onAction={onCreate}
      />
    );
  }
  return (
    <Grid>
      {parts.map((part) => (
        <article key={part.id} className="animated-enter premium-card rounded-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black">{part.name}</h2>
              <p className="text-sm text-steel">{part.sku}</p>
            </div>
            {part.quantity <= part.lowStockAt && <Badge value="ACHTUNG" label="Niedrig" />}
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <Info label="Bestand" value={`${part.quantity} Stk.`} strong />
            <Info label="Einkauf" value={currency.format(part.purchasePrice)} />
            <Info label="Verkauf" value={currency.format(part.sellingPrice)} />
            <Info label="Marge" value={currency.format(part.sellingPrice - part.purchasePrice)} />
            <Info label="Warnung ab" value={`${part.lowStockAt} Stk.`} />
          </dl>
          <button onClick={() => onDelete(part.id)} className="touch-button mt-4 rounded-md border border-slate-200 px-3 py-2 text-sm font-black transition hover:border-red-500 hover:text-red-600 dark:border-white/10">
            Teil löschen
          </button>
        </article>
      ))}
    </Grid>
  );
}

function Reminders({ reminders, onCreate, onDelete }: { reminders: Reminder[]; onCreate: () => void; onDelete: (id: string) => void }) {
  if (reminders.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Noch keine Erinnerungen"
        description="Erstellen Sie echte TÜV-, Ölservice-, Bremsen- oder individuelle Fahrzeugerinnerungen."
        action="Neue Erinnerung erstellen"
        onAction={onCreate}
      />
    );
  }
  return <ReminderGrid reminders={reminders} onCreate={onCreate} onDelete={onDelete} />;
}

function ReminderGrid({ reminders, onCreate, onDelete }: { reminders: Reminder[]; onCreate?: () => void; onDelete?: (id: string) => void }) {
  if (reminders.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Noch keine Erinnerungen"
        description="Sobald echte Fahrzeugdaten vorhanden sind, erscheinen hier fällige Services und Fristen."
        action="Neue Erinnerung erstellen"
        onAction={onCreate ?? (() => undefined)}
      />
    );
  }
  return (
    <Grid>
      {reminders.map((reminder) => (
        <article key={reminder.id} className="animated-enter premium-card rounded-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black">{reminder.type.replace("_", " ")}</h2>
              <p className="text-sm text-steel">{formatDate(reminder.dueAt)}</p>
            </div>
            <Bell className="h-5 w-5 text-signal" />
          </div>
          <p className="mt-3 text-sm">{reminder.message}</p>
          {reminder.vehicle && (
            <p className="mt-3 rounded-md bg-slate-100 p-2 text-sm font-semibold dark:bg-white/10">
              {reminder.vehicle.licensePlate} · {reminder.vehicle.customer.name}
            </p>
          )}
          {onDelete && (
            <button onClick={() => onDelete(reminder.id)} className="touch-button mt-4 rounded-md border border-slate-200 px-3 py-2 text-sm font-black transition hover:border-red-500 hover:text-red-600 dark:border-white/10">
              Erinnerung löschen
            </button>
          )}
        </article>
      ))}
    </Grid>
  );
}

function Communication({ customers, onCreate }: { customers: Customer[]; onCreate: () => void }) {
  const templates = [
    "Guten Tag, Ihr Termin bei KFZ Agani ist bestätigt. Bitte bringen Sie Fahrzeugschein und Serviceheft mit.",
    "Guten Tag, die Inspektion ist abgeschlossen. Wir melden uns mit Empfehlung und Kostenübersicht.",
    "Guten Tag, Ihr Fahrzeug ist bald für Service/TÜV fällig. Sollen wir einen passenden Termin reservieren?"
  ];
  return (
    customers.length === 0 ? (
      <EmptyState
        icon={Phone}
        title="Noch keine Kontakte für Kommunikation"
        description="Sobald echte Kunden angelegt sind, stehen WhatsApp-Vorlagen für Terminbestätigung, Fertigmeldung und Serviceerinnerung bereit."
        action="Neuen Kunden anlegen"
        onAction={onCreate}
      />
    ) :
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <Panel title="Nachrichtenvorlagen" action="Deutsch">
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template} className="rounded-md bg-slate-100 p-3 text-sm dark:bg-white/10">
              {template}
            </div>
          ))}
        </div>
      </Panel>
      <Grid>
        {customers.map((customer) => (
          <article key={customer.id} className="animated-enter premium-card rounded-md p-4">
            <h2 className="font-black">{customer.name}</h2>
            <p className="mt-1 text-sm text-steel">{customer.whatsapp}</p>
            <div className="mt-4 grid gap-2">
              {templates.map((template, index) => (
                <a
                  key={template}
                  href={whatsappLink(customer.whatsapp, template)}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold hover:border-signal hover:text-signal dark:border-white/10"
                >
                  <Phone className="h-4 w-4" />
                  Vorlage {index + 1} senden
                </a>
              ))}
            </div>
          </article>
        ))}
      </Grid>
    </div>
  );
}

function Reports({ data, report, onCreate }: { data: AppData; report: { openInvoices: Invoice[]; partsProfit: number; bestCustomers: { name: string; revenue: number }[] }; onCreate: () => void }) {
  if (data.invoices.length === 0 && data.workOrders.length === 0) {
    return (
      <EmptyState
        icon={BadgeEuro}
        title="Noch keine Reports verfügbar"
        description="Reports entstehen automatisch, sobald echte Rechnungen, Aufträge und Teilebewegungen erfasst werden."
        action="Ersten Beleg erfassen"
        onAction={onCreate}
      />
    );
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MiniStat label="Monatsumsatz" value={currency.format(data.metrics.monthlyRevenue)} />
        <MiniStat label="Offene Rechnungen" value={String(report.openInvoices.length)} />
        <MiniStat label="Teilegewinn Lager" value={currency.format(report.partsProfit)} />
        <MiniStat label="Fertige Jobs" value={String(data.workOrders.filter((order) => order.status === "FERTIG").length)} />
        <MiniStat label="Inspektionen" value={String(data.inspections.length)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Beste Kunden" action="Umsatz">
          <div className="space-y-2">
            {report.bestCustomers.map((customer) => (
              <Info key={customer.name} label={customer.name} value={currency.format(customer.revenue)} strong />
            ))}
          </div>
        </Panel>
        <Panel title="Häufige Reparaturen" action="Echte Daten">
          <div className="space-y-2">
            <Info label="Auswertung" value={data.workOrders.length > 0 ? `${data.workOrders.length} Auftrag(e)` : "Noch keine Daten"} />
          </div>
        </Panel>
        <Panel title="Zahlungsstatus" action="Rechnungen">
          <div className="space-y-2">
            {["UNBEZAHLT", "TEILZAHLUNG", "BEZAHLT"].map((status) => (
              <Info key={status} label={statusLabel[status]} value={`${data.invoices.filter((invoice) => invoice.status === status).length} Belege`} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AdminSettings({ settings, onSave }: { settings: CompanySettings; onSave: (values: Record<string, string>) => void }) {
  const exports = [
    { label: "Kunden als CSV exportieren", href: "/api/export/csv/customers" },
    { label: "Fahrzeuge als CSV exportieren", href: "/api/export/csv/vehicles" },
    { label: "Arbeitsaufträge als PDF exportieren", href: "/api/export/pdf/work-orders" }
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <Panel title="Company Profile" action="Onboarding">
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>);
          }}
        >
          <FieldInput name="companyName" label="Firmenname" defaultValue={settings.companyName} />
          <LogoUploadField defaultValue={settings.logoDataUrl ?? ""} />
          <FieldInput name="address" label="Adresse" defaultValue={settings.address ?? ""} />
          <FieldInput name="phone" label="Telefon" defaultValue={settings.phone ?? ""} />
          <FieldInput name="email" label="E-Mail" defaultValue={settings.email ?? ""} />
          <FieldInput name="website" label="Website" defaultValue={settings.website ?? ""} />
          <FieldInput name="taxNumber" label="Steuernummer" defaultValue={settings.taxNumber ?? ""} />
          <FieldInput name="vatRate" label="MwSt. %" type="number" defaultValue={String(settings.vatRate)} />
          <FieldInput name="invoicePrefix" label="Rechnungspräfix" defaultValue={settings.invoicePrefix} />
          <FieldInput name="nextInvoiceNumber" label="Nächste Rechnungsnummer" type="number" defaultValue={String(settings.nextInvoiceNumber)} />
          <label className="sm:col-span-2 text-sm font-bold text-steel">
            Öffnungszeiten
            <input name="openingHours" defaultValue={settings.openingHours ?? ""} className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-steel">
            <input name="weekendAvailability" type="checkbox" defaultChecked={settings.weekendAvailability} className="h-5 w-5" />
            Wochenendtermine
          </label>
          <button className="touch-button rounded-md bg-ink px-5 py-3 text-sm font-black text-white shadow-lg shadow-ink/20 transition hover:bg-signal dark:bg-white dark:text-ink sm:col-span-2">
            Einstellungen speichern
          </button>
        </form>
      </Panel>
      <Panel title="Backup und Export" action="Admin">
        <div className="grid gap-3">
          {exports.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="touch-button inline-flex items-center justify-between rounded-md border border-slate-200 bg-white/70 px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 hover:border-signal hover:text-signal dark:border-white/10 dark:bg-white/5"
            >
              {item.label}
              <Download className="h-4 w-4" />
            </a>
          ))}
        </div>
      </Panel>
      <Panel title="Betriebsdaten" action="KFZ Agani">
        <div className="space-y-3 text-sm text-steel">
          <p>PDF-Belege nutzen Firmenname, Adresse, Telefon, E-Mail, Steuernummer, MwSt.-Satz und Rechnungsnummern aus diesen Einstellungen.</p>
          <p>Die SQLite-Datenbank liegt lokal unter `prisma/dev.db` und bleibt nach Neustart erhalten.</p>
          <p>Öffentliche Seiten: <a className="font-black text-signal" href="/portal" target="_blank">Kundenportal</a>, <a className="font-black text-signal" href="/impressum" target="_blank">Impressum</a>, <a className="font-black text-signal" href="/datenschutz" target="_blank">Datenschutz</a>.</p>
        </div>
      </Panel>
    </div>
  );
}

function FieldInput({ name, label, defaultValue, type = "text" }: { name: string; label: string; defaultValue: string; type?: string }) {
  return (
    <label className="text-sm font-bold text-steel">
      {label}
      <input name={name} type={type} defaultValue={defaultValue} className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
    </label>
  );
}

function LogoUploadField({ defaultValue = "" }: { defaultValue?: string }) {
  const [logo, setLogo] = useState(defaultValue);
  return (
    <label className="text-sm font-bold text-steel">
      Logo Upload
      <input name="logoDataUrl" type="hidden" value={logo} />
      <input
        type="file"
        accept="image/*"
        className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-black file:text-white focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white dark:file:bg-white dark:file:text-ink"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => setLogo(String(reader.result));
          reader.readAsDataURL(file);
        }}
      />
      {logo && <span className="mt-1 block text-xs font-semibold text-emerald-600">Logo bereit zum Speichern</span>}
    </label>
  );
}

function InspectionModule({ inspections, packages, onCreate }: { inspections: Inspection[]; packages: InspectionPackage[]; onCreate: () => void }) {
  if (inspections.length === 0 && packages.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Noch keine Inspektionspakete"
        description="Legen Sie echte KFZ Agani Prüfchecklisten an, bevor Inspektionsberichte erzeugt werden."
        action="Inspektionspaket erstellen"
        onAction={onCreate}
      />
    );
  }
  return (
    <div className="space-y-5">
      <Grid>
        {packages.map((pkg) => {
          const checklist: string[] = JSON.parse(pkg.checklist);
          return (
            <article key={pkg.id} className="animated-enter premium-card rounded-md p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black">{pkg.name}</h2>
                  <p className="mt-1 text-sm text-steel">{pkg.description}</p>
                </div>
                <span className="rounded-md bg-ink px-2 py-1 text-xs font-bold text-white dark:bg-white dark:text-ink">
                  {currency.format(pkg.basePrice)}
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {checklist.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-signal" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </Grid>
      <Panel title="Prüfberichte" action="PDF mit KFZ Agani Branding">
        <div className="space-y-3">
          {inspections.map((inspection) => (
            <Row key={inspection.id}>
              <div>
                <div className="font-bold">{inspection.reportNumber} · {inspection.package.name}</div>
                <div className="text-sm text-steel">
                  {inspection.vehicle.customer.name} · {inspection.vehicle.licensePlate} · Empfehlung: {inspection.recommendation}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {inspection.items.map((item) => (
                    <Badge key={item.id} value={item.status} label={`${item.label}: ${statusLabel[item.status] || item.status}`} />
                  ))}
                </div>
              </div>
              <a
                href={`/api/pdf/inspection/${inspection.id}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-bold text-white dark:bg-white dark:text-ink"
              >
                <Download className="h-4 w-4" />
                PDF
              </a>
            </Row>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Roles({ staff, onCreate, onDelete }: { staff: StaffUser[]; onCreate: () => void; onDelete: (id: string) => void }) {
  if (staff.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Noch keine Benutzer angelegt"
        description="Die Login-Rollen sind vorbereitet. Legen Sie echte Mitarbeiterkonten für Admin, Mechanik und Annahme an."
        action="Neuen Benutzer anlegen"
        onAction={onCreate}
      />
    );
  }
  return (
    <Grid>
      {staff.map((user) => (
        <article key={user.id} className="animated-enter premium-card rounded-md p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black">{user.name}</h2>
              <p className="text-sm text-steel">{user.email}</p>
            </div>
            <Badge value={user.role} />
          </div>
          <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm dark:bg-white/10">
            {user.role === "ADMIN" && "Vollzugriff auf Kunden, Preise, Reports, Export und Stammdaten."}
            {user.role === "MECHANIC" && "Bearbeitet Aufträge, Diagnosen, Fotos, Prüfberichte und Teileverbrauch."}
            {user.role === "RECEPTION" && "Steuert Annahme, Termine, Kundenkontakt und Check-in."}
          </p>
          <button onClick={() => onDelete(user.id)} className="touch-button mt-4 rounded-md border border-slate-200 px-3 py-2 text-sm font-black transition hover:border-red-500 hover:text-red-600 dark:border-white/10">
            Benutzer löschen
          </button>
        </article>
      ))}
    </Grid>
  );
}

function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="animated-enter premium-card rounded-md p-4">
      <div className="card-body">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black tracking-tight">{title}</h2>
        {action && <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-steel dark:border-white/10 dark:bg-white/10">{action}</span>}
      </div>
      {children}
      </div>
    </section>
  );
}

function MechanicDashboard({
  data,
  orderStatuses,
  onStatusChange,
  setActive
}: {
  data: AppData;
  orderStatuses: Record<string, string>;
  onStatusChange: (orderId: string, status: string) => void;
  setActive: (module: (typeof modules)[number]["id"]) => void;
}) {
  const activeJobs = data.workOrders.filter((order) => !["BEZAHLT", "ABGEHOLT"].includes(orderStatuses[order.id] ?? order.status));

  if (activeJobs.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="Keine aktiven Werkstattjobs"
        description="Sobald echte Aufträge angelegt sind, erscheinen hier große Statusflächen für schnelle Mechaniker-Updates."
        action="Fahrzeug Check-in öffnen"
        onAction={() => setActive("checkin")}
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="animated-enter premium-card rounded-md p-4 sm:p-5">
        <div className="card-body grid gap-5 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-signal/20 bg-signal/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-signal">
              <Timer className="h-3.5 w-3.5" />
              Mechaniker Cockpit
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Nächster Handgriff zählt.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-steel">
              Große Statusflächen, schnelle Check-in Übergabe und direkte Teile-/Prüfbericht-Wege für Touchscreens in der Werkstatt.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TouchAction icon={PlayCircle} label="Nächsten Job öffnen" onClick={() => setActive("orders")} />
            <TouchAction icon={PenLine} label="Fahrzeug Check-in" onClick={() => setActive("checkin")} />
            <TouchAction icon={Package} label="Teile prüfen" onClick={() => setActive("inventory")} />
            <TouchAction icon={ClipboardCheck} label="Inspektion" onClick={() => setActive("inspection")} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {activeJobs.map((order) => (
          <MechanicJobCard key={order.id} order={order} status={orderStatuses[order.id] ?? order.status} onStatusChange={onStatusChange} />
        ))}
      </div>
    </div>
  );
}

function ReceptionDashboard({ data, setActive }: { data: AppData; setActive: (module: (typeof modules)[number]["id"]) => void }) {
  if (data.customers.length === 0 && data.appointments.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Annahme ist leer"
        description="Legen Sie den ersten echten Kunden an. Danach können Termine, Check-ins und WhatsApp-Nachrichten direkt aus der Annahme gesteuert werden."
        action="Neuen Kunden anlegen"
        onAction={() => setActive("customers")}
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="animated-enter premium-card rounded-md p-4 sm:p-5">
        <div className="card-body grid gap-5 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-signal/20 bg-signal/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-signal">
              <Users className="h-3.5 w-3.5" />
              Annahme Desk
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Empfang ohne Wartezeit.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-steel">
              Termine, Kundenkontakt, Unterschrift und Schadensfotos liegen in einem schnellen Empfangsablauf.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TouchAction icon={PenLine} label="Check-in starten" onClick={() => setActive("checkin")} />
            <TouchAction icon={CalendarDays} label="Terminplan" onClick={() => setActive("calendar")} />
            <TouchAction icon={Phone} label="WhatsApp senden" onClick={() => setActive("communication")} />
            <TouchAction icon={FileText} label="Belege" onClick={() => setActive("billing")} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Nächste Annahmen" action={`${data.todayAppointments.length} heute`}>
          <div className="space-y-3">
            {data.todayAppointments.map((appointment) => (
              <Row key={appointment.id}>
                <div>
                  <div className="text-lg font-black">{formatTime(appointment.startsAt)} · {appointment.customer.name}</div>
                  <div className="text-sm text-steel">{appointment.vehicle.licensePlate} · {appointment.title}</div>
                </div>
                <button onClick={() => setActive("checkin")} className="touch-button rounded-md bg-ink px-4 py-3 text-sm font-black text-white shadow-lg shadow-ink/20 transition hover:bg-signal dark:bg-white dark:text-ink">
                  Einchecken
                </button>
              </Row>
            ))}
          </div>
        </Panel>
        <Panel title="Kundenkontakt" action="bereit">
          <div className="space-y-3">
            {data.customers.slice(0, 3).map((customer) => (
              <Row key={customer.id}>
                <div>
                  <div className="font-black">{customer.name}</div>
                  <div className="text-sm text-steel">{customer.whatsapp}</div>
                </div>
                <a className="touch-button rounded-md border border-slate-200 px-4 py-3 text-sm font-black transition hover:border-signal hover:text-signal dark:border-white/10" href={whatsappLink(customer.whatsapp, "Guten Tag, Ihr Termin bei KFZ Agani ist bestätigt.")} target="_blank">
                  WhatsApp
                </a>
              </Row>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TouchAction({ icon: Icon, label, onClick }: { icon: ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="touch-button group rounded-md border border-slate-200 bg-white/70 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-signal dark:border-white/10 dark:bg-white/5">
      <Icon className="h-6 w-6 text-signal transition group-hover:scale-110" />
      <div className="mt-3 text-sm font-black leading-tight">{label}</div>
    </button>
  );
}

function MechanicJobCard({
  order,
  status,
  onStatusChange
}: {
  order: WorkOrder;
  status: string;
  onStatusChange: (orderId: string, status: string) => void;
}) {
  const fastStatuses = ["ANGENOMMEN", "DIAGNOSE_LAEUFT", "WARTET_AUF_TEILE", "IN_ARBEIT", "FERTIG"];
  return (
    <article className="animated-enter premium-card rounded-md p-4">
      <div className="card-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-steel">{order.number}</div>
            <h3 className="mt-1 text-2xl font-black tracking-tight">{order.vehicle.licensePlate}</h3>
            <p className="mt-1 text-sm text-steel">{order.vehicle.brand} {order.vehicle.model} · {order.customer.name}</p>
          </div>
          <Badge value={status} />
        </div>
        <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm font-semibold dark:bg-white/10">{order.customerComplaint}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {fastStatuses.map((nextStatus) => (
            <button
              key={nextStatus}
              onClick={() => onStatusChange(order.id, nextStatus)}
              className={clsx(
                "touch-button min-h-[68px] rounded-md border px-2 py-3 text-xs font-black transition hover:-translate-y-0.5",
                status === nextStatus
                  ? "border-signal bg-signal text-white shadow-lg shadow-signal/20"
                  : "border-slate-200 bg-white/70 hover:border-signal dark:border-white/10 dark:bg-white/5"
              )}
            >
              {statusLabel[nextStatus]}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function CheckInScreen({
  data,
  checkedInVehicles,
  onCheckIn,
  onCreate
}: {
  data: AppData;
  checkedInVehicles: Record<string, boolean>;
  onCheckIn: (vehicleId: string) => void;
  onCreate: () => void;
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(data.vehicles[0]?.id ?? "");
  const [damageNote, setDamageNote] = useState("Kratzer / Dellen bei Annahme dokumentieren.");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const selectedVehicle = data.vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? data.vehicles[0];
  const appointment = data.appointments.find((item) => item.vehicle.id === selectedVehicle?.id);

  const handlePhoto = (file?: File) => {
    if (!file) {
      setPhotoPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  if (!selectedVehicle) {
    return (
      <EmptyState
        icon={PenLine}
        title="Check-in bereit, aber noch kein Fahrzeug vorhanden"
        description="Legen Sie zuerst ein echtes Kundenfahrzeug an. Danach kann die Annahme mit Unterschrift und Schadenfoto durchgeführt werden."
        action="Neues Fahrzeug hinzufügen"
        onAction={onCreate}
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="animated-enter premium-card rounded-md p-4 sm:p-5">
        <div className="card-body grid gap-5 xl:grid-cols-[1fr_420px] xl:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-signal/20 bg-signal/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-signal">
              <PenLine className="h-3.5 w-3.5" />
              Digitaler Fahrzeug Check-in
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">{selectedVehicle.licensePlate}</h2>
            <p className="mt-3 text-sm leading-6 text-steel">
              {selectedVehicle.brand} {selectedVehicle.model} · {selectedVehicle.customer?.name ?? "Kunde offen"} · {number.format(selectedVehicle.mileage)} km
            </p>
          </div>
          <div className="grid gap-3">
            <button
              onClick={() => onCheckIn(selectedVehicle.id)}
              className={clsx(
                "touch-button rounded-md px-5 py-5 text-left text-lg font-black shadow-lg transition hover:-translate-y-0.5",
                checkedInVehicles[selectedVehicle.id]
                  ? "bg-emerald-600 text-white shadow-emerald-600/20"
                  : "bg-ink text-white shadow-ink/20 hover:bg-signal dark:bg-white dark:text-ink"
              )}
            >
              <CheckCircle2 className="mb-3 h-7 w-7" />
              {checkedInVehicles[selectedVehicle.id] ? "Fahrzeug eingecheckt" : "Ein-Klick Check-in"}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <TouchAction icon={Camera} label="Schadenfoto" onClick={() => document.getElementById("damage-photo")?.click()} />
              <TouchAction icon={ClipboardList} label="Auftrag öffnen" onClick={() => undefined} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Panel title="Fahrzeug wählen" action="Annahme">
          <div className="space-y-2">
            {data.vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                className={clsx(
                  "touch-button w-full rounded-md border p-3 text-left transition hover:-translate-y-0.5",
                  selectedVehicle.id === vehicle.id
                    ? "border-signal bg-signal text-white shadow-lg shadow-signal/20"
                    : "border-slate-200 bg-white/70 hover:border-signal dark:border-white/10 dark:bg-white/5"
                )}
              >
                <div className="font-black">{vehicle.licensePlate}</div>
                <div className={clsx("text-sm", selectedVehicle.id === vehicle.id ? "text-white/80" : "text-steel")}>
                  {vehicle.brand} {vehicle.model}
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Annahmedaten" action={appointment ? formatTime(appointment.startsAt) : "ohne Termin"}>
            <div className="space-y-3">
              <Info label="Kunde" value={selectedVehicle.customer?.name ?? "-"} strong />
              <Info label="Telefon" value={selectedVehicle.customer?.phone ?? "-"} />
              <Info label="VIN" value={selectedVehicle.vin ?? "-"} />
              <Info label="Kilometer" value={`${number.format(selectedVehicle.mileage)} km`} />
              <textarea
                value={damageNote}
                onChange={(event) => setDamageNote(event.target.value)}
                className="min-h-[126px] w-full rounded-md border border-slate-200 bg-white/70 p-3 text-sm font-semibold outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/10 dark:border-white/10 dark:bg-white/5"
              />
            </div>
          </Panel>

          <Panel title="Schadenfoto" action="Upload">
            <input id="damage-photo" className="hidden" type="file" accept="image/*" capture="environment" onChange={(event) => handlePhoto(event.target.files?.[0])} />
            <button
              onClick={() => document.getElementById("damage-photo")?.click()}
              className="touch-button flex min-h-[240px] w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-white/60 text-center text-sm font-black transition hover:border-signal hover:text-signal dark:border-white/15 dark:bg-white/5"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Schadenfoto Vorschau" className="h-full max-h-[320px] w-full rounded-md object-cover" />
              ) : (
                <span>
                  <Camera className="mx-auto mb-3 h-8 w-8" />
                  Foto aufnehmen oder hochladen
                </span>
              )}
            </button>
          </Panel>
        </div>
      </div>

      <Panel title="Kundenunterschrift" action="Touch Signatur">
        <SignaturePad />
      </Panel>
    </div>
  );
}

function SignaturePad() {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [drawing, setDrawing] = useState(false);

  const addPoint = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setPoints((current) => [...current, { x: event.clientX - box.left, y: event.clientY - box.top }]);
  };

  return (
    <div>
      <div
        className="signature-pad relative h-[220px] touch-none rounded-md border border-slate-200 bg-white/75 dark:border-white/10 dark:bg-white/5"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrawing(true);
          addPoint(event);
        }}
        onPointerMove={(event) => drawing && addPoint(event)}
        onPointerUp={() => setDrawing(false)}
        onPointerLeave={() => setDrawing(false)}
      >
        <svg className="absolute inset-0 h-full w-full">
          <polyline
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            className="text-ink dark:text-white"
          />
        </svg>
        {points.length === 0 && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-black uppercase tracking-[0.16em] text-steel">
            Hier unterschreiben
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setPoints([])} className="touch-button rounded-md border border-slate-200 px-4 py-3 text-sm font-black transition hover:border-signal hover:text-signal dark:border-white/10">
          Löschen
        </button>
        <button className="touch-button rounded-md bg-ink px-4 py-3 text-sm font-black text-white shadow-lg shadow-ink/20 transition hover:bg-signal dark:bg-white dark:text-ink">
          Signatur bestätigen
        </button>
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{children}</div>;
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white/70 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-signal/30 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  );
}

function Info({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-white/10">
      <dt className="text-steel">{label}</dt>
      <dd className={clsx("text-right", strong ? "font-black" : "font-semibold")}>{value}</dd>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-bold text-steel">{label}</div>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={clsx("w-fit rounded-md px-2 py-1 text-xs font-black shadow-sm ring-1 ring-black/5 dark:ring-white/10", badgeTone[value] || "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200")}>
      {label || statusLabel[value] || value}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card rounded-md p-4">
      <div className="card-body">
        <div className="text-sm font-semibold text-steel">{label}</div>
        <div className="mt-2 text-xl font-black">{value}</div>
      </div>
    </div>
  );
}

function SlotGroup({ title, slots }: { title: string; slots: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-black">{title}</h3>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <button key={slot} className="rounded-md border border-slate-200 bg-white/70 px-2 py-2 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-signal hover:text-signal dark:border-white/10 dark:bg-white/5">
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}
