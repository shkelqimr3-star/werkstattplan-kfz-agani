"use client";

import { useState } from "react";
import { Camera, CheckCircle2, Send, Wrench } from "lucide-react";

export default function PortalPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const addPhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotos((current) => [...current, String(reader.result)]);
    reader.readAsDataURL(file);
  };

  if (done) {
    return (
      <main className="premium-shell grid min-h-screen place-items-center px-4 py-8 text-ink dark:text-slate-100">
        <section className="premium-card max-w-xl rounded-md p-8 text-center">
          <div className="card-body">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
            <h1 className="mt-5 text-3xl font-black tracking-tight">Anfrage erfolgreich gesendet</h1>
            <p className="mt-3 text-sm leading-6 text-steel">KFZ Agani hat Ihre Terminanfrage erhalten und meldet sich zur Bestätigung.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="premium-shell min-h-screen px-4 py-8 text-ink dark:text-slate-100">
      <form
        className="mx-auto max-w-4xl premium-card rounded-md p-5 sm:p-8"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          const values = Object.fromEntries(new FormData(event.currentTarget).entries());
          const response = await fetch("/api/portal/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...values, gdprConsent: values.gdprConsent === "on", photos })
          });
          if (!response.ok) {
            const result = await response.json().catch(() => ({ error: "Anfrage konnte nicht gesendet werden." }));
            setError(result.error);
            return;
          }
          setDone(true);
        }}
      >
        <div className="card-body">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-md bg-ink text-white dark:bg-white dark:text-ink">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-steel">KFZ Agani Kundenportal</div>
              <h1 className="text-3xl font-black tracking-tight">Termin anfragen</h1>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Field name="customerName" label="Name" required />
            <Field name="phone" label="Telefon" required />
            <Field name="email" label="E-Mail" type="email" />
            <Field name="preferredDate" label="Wunschtermin" type="datetime-local" />
            <Field name="vehicleBrand" label="Marke" required />
            <Field name="vehicleModel" label="Modell" required />
            <Field name="licensePlate" label="Kennzeichen" required />
            <Field name="mileage" label="Kilometerstand" type="number" />
            <label className="md:col-span-2 text-sm font-bold text-steel">
              Anliegen
              <textarea name="message" className="mt-1 min-h-[120px] w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
          </div>

          <div className="mt-5 rounded-md border border-dashed border-slate-300 p-4 dark:border-white/15">
            <label className="touch-button inline-flex cursor-pointer items-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-ink">
              <Camera className="h-4 w-4" />
              Fahrzeugfotos hochladen
              <input className="hidden" type="file" accept="image/*" multiple onChange={(event) => Array.from(event.target.files || []).forEach(addPhoto)} />
            </label>
            {photos.length > 0 && <div className="mt-3 text-sm font-bold text-steel">{photos.length} Foto(s) hinzugefügt</div>}
          </div>

          <label className="mt-5 flex gap-3 text-sm font-semibold text-steel">
            <input name="gdprConsent" type="checkbox" className="mt-1 h-5 w-5" required />
            Ich stimme zu, dass KFZ Agani meine Angaben zur Bearbeitung der Terminanfrage verarbeitet.
          </label>

          {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950 dark:text-red-100">{error}</div>}

          <button className="touch-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-4 text-sm font-black text-white shadow-lg shadow-ink/20 transition hover:bg-signal dark:bg-white dark:text-ink">
            Anfrage senden
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="text-sm font-bold text-steel">
      {label}
      <input name={name} type={type} required={required} className="mt-1 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-ink outline-none focus:border-signal dark:border-white/10 dark:bg-white/5 dark:text-white" />
    </label>
  );
}
