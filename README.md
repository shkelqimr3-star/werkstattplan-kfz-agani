# WerkstattPlan by KFZ Agani

Professionelle deutschsprachige Werkstattverwaltung fuer eine kleine KFZ-Werkstatt in Deutschland. Die App ist mobile-first gebaut und enthaelt Dashboard, Kunden, Fahrzeuge, Kalender, digitale Arbeitsauftraege, Angebote/Rechnungen, Lager, Erinnerungen, WhatsApp-Kommunikation, Reports, Inspektionspakete und Rollen.

## Lokal starten

```bash
npm install
npm run db:reset
npm run dev
```

Danach laeuft die App normalerweise auf `http://localhost:3000`.
Beim ersten Start zeigt WerkstattPlan eine Admin-Ersteinrichtung. Danach erfolgt der Login mit E-Mail und Passwort.

## Datenbank

- Prisma Schema: `prisma/schema.prisma`
- SQLite Dev-Datenbank: `prisma/dev.db`
- Leerer Seed ohne Beispielkunden, mit echten Inspektionspaket-Vorlagen: `prisma/seed.ts`
- Verbindung: `.env` mit `DATABASE_URL="file:./dev.db"`

Die Oberflaeche nutzt Prisma/SQLite-Daten und speichert Kunden, Fahrzeuge, Termine, Auftraege, Rechnungen, Lager, Erinnerungen, Inspektionen und Benutzer dauerhaft lokal.

## PDF

PDFs werden serverseitig mit `pdfkit` erzeugt:

- Rechnungen/Angebote: `/api/pdf/invoice/[id]`
- Inspektionsberichte: `/api/pdf/inspection/[id]`

## Enthaltene Module

- Dashboard mit heutigen Terminen, offenen Auftraegen, Tagesabschluessen, Monatsumsatz, Erinnerungen und Fahrzeugen in der Werkstatt
- Kundenverwaltung mit DSGVO-Status, Kontakt- und Historienfeldern
- Fahrzeugverwaltung mit VIN, Kilometerstand, Motor, TUEV, Oelservice und Servicehistorie
- Terminverwaltung mit Werktagsslots nach 17:00 Uhr und Wochenendverfuegbarkeit
- Digitale Arbeitsauftraege mit Statusstrecke, Diagnose, Teilen, Arbeitszeit, Fotos und Notizen
- Angebote, Rechnungen, MwSt., Rabatt, Zahlungsstatus und PDF-Ausgabe
- Lagerbestand mit Einkauf, Verkauf, Marge und Niedrigbestand-Warnung
- TUEV-, Oelservice-, Bremsen- und individuelle Erinnerungen
- WhatsApp-Vorlagen fuer Terminbestaetigung, fertige Inspektion und Serviceerinnerung
- Reports fuer Umsatz, offene Rechnungen, beste Kunden, Reparaturen, Teilegewinn und Statistik
- Basis Check, Premium Check und Gebrauchtwagen Check inklusive Status, Notizen, Fotos, Empfehlung, Kostenschaetzung und PDF-Bericht
- Rollen fuer Admin, Mechaniker und Nur-Lesen-Mitarbeiter
