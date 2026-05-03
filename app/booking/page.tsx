"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, LockKeyhole, Send, Sparkles, Wrench, type LucideIcon } from "lucide-react";

const serviceTypes = [
  "Ölservice",
  "Bremsen",
  "Diagnose",
  "Inspektion",
  "TÜV Vorbereitung",
  "Reifenwechsel",
  "Klimaservice",
  "Sonstiges"
];

export default function BookingPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/booking/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, gdprConsent: values.gdprConsent === "on" })
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
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-steel">Terminanfrage eingegangen</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Vielen Dank. Ihre Terminanfrage wurde gesendet. KFZ Agani meldet sich zur Bestätigung.
            </h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="premium-shell min-h-screen px-4 py-5 text-ink dark:text-slate-100 sm:py-8">
      <form onSubmit={submit} className="mx-auto max-w-5xl">
        <section className="animated-enter premium-card rounded-md p-5 sm:p-8">
          <div className="card-body">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-ink text-white shadow-lg shadow-ink/20 dark:bg-white dark:text-ink">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-steel">
                    <Sparkles className="h-3.5 w-3.5 text-signal" />
                    WerkstattPlan by KFZ Agani
                  </div>
                  <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Termin anfragen</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-steel">
                    Senden Sie Ihre Anfrage direkt an die Annahme. KFZ Agani prüft den Wunschtermin und meldet sich zur Bestätigung.
                  </p>
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-steel shadow-sm dark:border-white/10 dark:bg-white/5">
                Öffentlich & sicher
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <SectionTitle title="Kontakt" icon={LockKeyhole} />
                <Field name="customerName" label="Name" required />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="phone" label="Telefonnummer" type="tel" required />
                  <Field name="whatsapp" label="WhatsApp Nummer" type="tel" required />
                </div>
                <Field name="email" label="E-Mail optional" type="email" />
              </div>

              <div className="space-y-4">
                <SectionTitle title="Fahrzeug" icon={Wrench} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="vehicleBrand" label="Marke" required />
                  <Field name="vehicleModel" label="Modell" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="licensePlate" label="Kennzeichen optional" />
                  <Field name="mileage" label="Kilometerstand optional" type="number" min="0" />
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <SectionTitle title="Wunschtermin" icon={CalendarDays} />
              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm font-bold text-steel">
                  Serviceart
                  <select name="serviceType" required defaultValue="" className="mt-1 h-[52px] w-full rounded-md border border-slate-200 bg-white/80 px-3 text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/10 dark:border-white/10 dark:bg-white/5 dark:text-white">
                    <option value="" disabled>Bitte auswählen</option>
                    {serviceTypes.map((serviceType) => (
                      <option key={serviceType} value={serviceType}>{serviceType}</option>
                    ))}
                  </select>
                </label>
                <Field name="preferredDate" label="Wunschtag" type="date" required />
                <Field name="preferredTime" label="Wunschzeit" type="time" required />
              </div>
              <label className="block text-sm font-bold text-steel">
                Nachricht / Problembeschreibung
                <textarea
                  name="message"
                  rows={5}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="Was soll geprüft oder repariert werden?"
                />
              </label>
            </div>

            <label className="mt-6 flex gap-3 rounded-md border border-slate-200 bg-white/70 p-4 text-sm font-semibold leading-6 text-steel dark:border-white/10 dark:bg-white/5">
              <input name="gdprConsent" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-[#d71920]" />
              Ich stimme zu, dass KFZ Agani meine Angaben zur Bearbeitung der Terminanfrage verarbeitet.
            </label>

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
                {error}
              </div>
            )}

            <button
              disabled={busy}
              className="touch-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-4 text-sm font-black text-white shadow-lg shadow-ink/20 transition hover:-translate-y-0.5 hover:bg-signal disabled:cursor-wait disabled:opacity-70 dark:bg-white dark:text-ink md:w-auto md:min-w-[260px]"
            >
              {busy ? "Anfrage wird gesendet" : "Terminanfrage senden"}
              <Send className="h-4 w-4" />
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}

function SectionTitle({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-steel">
      <Icon className="h-4 w-4 text-signal" />
      {title}
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  min
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <label className="block text-sm font-bold text-steel">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        className="mt-1 h-[52px] w-full rounded-md border border-slate-200 bg-white/80 px-3 text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
    </label>
  );
}
