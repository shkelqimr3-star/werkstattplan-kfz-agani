import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { currency, formatDate } from "@/lib/format";
import { findInspection, getCompanySettings } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const statusText: Record<string, string> = {
  OK: "OK",
  ACHTUNG: "Achtung",
  DEFEKT: "Defekt",
  NICHT_GEPRUEFT: "Nicht geprueft"
};

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const inspection = await findInspection(params.id);
  const settings = await getCompanySettings();

  if (!inspection) {
    return NextResponse.json({ error: "Pruefbericht nicht gefunden" }, { status: 404 });
  }

  const pdf = await renderPdf((doc) => {
    doc.rect(0, 0, 595, 96).fill("#101820");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text(settings.companyName || "KFZ Agani", 50, 28);
    doc.fillColor("#f5a524").fontSize(10).text("WerkstattPlan Inspektionsbericht", 52, 60);
    doc.fillColor("#ffffff").fontSize(16).text(inspection.reportNumber, 355, 36, { width: 190, align: "right" });

    doc.fillColor("#101820").font("Helvetica-Bold").fontSize(18).text(inspection.package.name, 50, 128);
    doc.font("Helvetica").fontSize(10).fillColor("#667085").text(inspection.package.description, 50, 153, { width: 480 });

    doc.roundedRect(50, 190, 495, 88, 6).stroke("#d0d5dd");
    doc.fillColor("#101820").font("Helvetica-Bold").fontSize(11).text("Fahrzeug", 68, 210);
    doc.font("Helvetica").fontSize(10).text(`${inspection.vehicle.brand} ${inspection.vehicle.model}`, 68, 230);
    doc.text(`Kennzeichen: ${inspection.vehicle.licensePlate}`, 68, 246);
    doc.text(`Kilometer: ${inspection.vehicle.mileage.toLocaleString("de-DE")} km`, 68, 262);
    doc.font("Helvetica-Bold").fontSize(11).text("Kunde", 330, 210);
    doc.font("Helvetica").fontSize(10).text(inspection.vehicle.customer.name, 330, 230);
    doc.text(inspection.vehicle.customer.phone, 330, 246);
    doc.text(formatDate(inspection.createdAt), 330, 262);

    let y = 320;
    doc.fillColor("#101820").font("Helvetica-Bold").fontSize(12).text("Checkliste", 50, y);
    y += 26;
    inspection.items.forEach((item: any) => {
      const tone = item.status === "OK" ? "#0f8a4b" : item.status === "ACHTUNG" ? "#b7791f" : item.status === "DEFEKT" ? "#c81e1e" : "#667085";
      doc.roundedRect(50, y - 6, 495, 34, 5).stroke("#e4e7ec");
      doc.fillColor("#101820").font("Helvetica-Bold").fontSize(10).text(item.label, 66, y + 4);
      doc.fillColor(tone).text(statusText[item.status] || item.status, 300, y + 4);
      doc.fillColor("#667085").font("Helvetica").text(item.notes || "", 390, y + 4, { width: 140 });
      y += 42;
    });

    y += 10;
    doc.fillColor("#101820").font("Helvetica-Bold").fontSize(12).text("Empfehlung", 50, y);
    doc.font("Helvetica").fontSize(10).text(inspection.recommendation || "Keine Empfehlung hinterlegt.", 50, y + 22, { width: 495 });
    doc.font("Helvetica-Bold").fontSize(11).text(`Geschaetzte Reparaturkosten: ${currency.format(inspection.estimatedCost)}`, 50, y + 62);

    doc.fillColor("#667085").font("Helvetica").fontSize(9).text("Statusoptionen: OK, Achtung, Defekt, Nicht geprueft. Fotos und Notizen koennen im digitalen Auftrag ergaenzt werden.", 50, 740, { width: 495 });
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${inspection.reportNumber}.pdf"`
    }
  });
}

function renderPdf(draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    draw(doc);
    doc.end();
  });
}
