"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  BatteryCharging,
  CalendarDays,
  Car,
  CheckCircle2,
  CircleHelp,
  Disc3,
  Fan,
  Gauge,
  SearchCheck,
  Send,
  Wrench,
  type LucideIcon
} from "lucide-react";

const serviceCategories: { label: string; icon: LucideIcon }[] = [
  { label: "Ölwechsel", icon: Gauge },
  { label: "Reifenwechsel", icon: Disc3 },
  { label: "Bremsen", icon: Wrench },
  { label: "Inspektion", icon: SearchCheck },
  { label: "Batterie", icon: BatteryCharging },
  { label: "Klimaanlage", icon: Fan },
  { label: "Fehlerdiagnose", icon: Car },
  { label: "Sonstiges", icon: CircleHelp }
];

function splitVehicle(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  const [brand = "", ...model] = text.split(/\s+/);
  return {
    vehicleBrand: brand,
    vehicleModel: model.join(" ") || "nicht angegeben"
  };
}

export default function BookingPage() {
  const [selectedService, setSelectedService] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const chooseService = (service: string) => {
    setSelectedService(service);
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const vehicle = splitVehicle(values.vehicle);
    const response = await fetch("/api/booking/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: values.customerName,
        phone: values.phone,
        whatsapp: values.phone,
        ...vehicle,
        licensePlate: values.licensePlate,
        preferredDate: values.preferredDate,
        preferredTime: values.preferredTime,
        serviceType: values.serviceType,
        message: values.message
      })
    });

    setBusy(false);
    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "Ihre Anfrage konnte nicht gesendet werden." }));
      setError(result.error || "Ihre Anfrage konnte nicht gesendet werden.");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <main className="premium-shell grid min-h-screen place-items-center px-4 py-8 text-ink dark:text-slate-100">
        <section className="animated-enter premium-card w-full max-w-xl rounded-md p-6 text-center sm:p-8">
          <div className="card-body">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-md bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-steel">Anfrage gesendet</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Vielen Dank! Ihre Anfrage wurde gesendet. Wir melden uns schnellstmöglich.
            </h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="premium-shell min-h-screen px-4 py-6 text-ink dark:text-slate-100 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <section className="animated-enter premium-card rounded-md p-5 sm:p-8">
          <div className="card-body">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">KFZ Agani</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Termin vereinbaren</h1>
                <p className="mt-2 text-lg font-bold text-steel">Schnell – Einfach – Direkt</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-steel shadow-sm dark:border-white/10 dark:bg-white/5">
                Lokale Werkstatt
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {serviceCategories.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => chooseService(label)}
                  className="touch-button group rounded-md border border-slate-200 bg-white/75 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-signal hover:shadow-premium dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-md bg-slate-100 text-ink transition group-hover:bg-ink group-hover:text-white dark:bg-white/10 dark:text-white dark:group-hover:bg-white dark:group-hover:text-ink">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-base font-black">{label}</span>
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-4 text-sm font-semibold text-steel">
              Nicht sicher, welchen Service Sie brauchen? Kontaktieren Sie uns einfach direkt.
            </p>
          </div>
        </section>

        <form ref={formRef} onSubmit={submit} className="animated-enter mt-6 rounded-md border border-black/10 bg-white/80 p-5 shadow-premium backdrop-blur-xl dark:border-white/10 dark:bg-[#111821]/85 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-ink text-white dark:bg-white dark:text-ink">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Ihre Anfrage</h2>
              <p className="text-sm font-semibold text-steel">Wir prüfen den Wunschtermin und melden uns persönlich.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field name="customerName" label="Name" required />
            <Field name="phone" label="Telefonnummer" type="tel" required />
            <Field name="vehicle" label="Fahrzeug Marke / Modell" required />
            <Field name="licensePlate" label="Kennzeichen (optional)" />
            <Field name="preferredDate" label="Wunschdatum" type="date" required />
            <Field name="preferredTime" label="Wunschuhrzeit" type="time" required />
            <label className="block text-sm font-bold text-steel md:col-span-2">
              Service
              <select
                name="serviceType"
                value={selectedService}
                onChange={(event) => setSelectedService(event.target.value)}
                required
                className="mt-1 h-[52px] w-full rounded-md border border-slate-200 bg-white/80 px-3 text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <option value="" disabled>Service auswählen</option>
                {serviceCategories.map((service) => (
                  <option key={service.label} value={service.label}>{service.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-steel md:col-span-2">
              Nachricht / Bemerkung
              <textarea
                name="message"
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="Kurz beschreiben, worum es geht."
              />
            </label>
          </div>

          <p className="mt-4 text-xs leading-5 text-steel">
            Mit dem Absenden verwenden wir Ihre Angaben ausschließlich zur Bearbeitung Ihrer Terminanfrage.
          </p>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
              {error}
            </div>
          )}

          <button
            disabled={busy}
            className="touch-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-4 text-sm font-black text-white shadow-lg shadow-ink/20 transition hover:-translate-y-0.5 hover:bg-signal disabled:cursor-wait disabled:opacity-70 dark:bg-white dark:text-ink sm:w-auto sm:min-w-[240px]"
          >
            {busy ? "Anfrage wird gesendet" : "Termin anfragen"}
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-bold text-steel">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 h-[52px] w-full rounded-md border border-slate-200 bg-white/80 px-3 text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
    </label>
  );
}
