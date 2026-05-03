import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { currency, formatDate } from "@/lib/format";
import { findInvoice } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const invoice = await findInvoice(params.id);

  if (!invoice) {
    return NextResponse.json({ error: "Beleg nicht gefunden" }, { status: 404 });
  }

  const pdf = await renderPdf((doc) => {
    drawHeader(doc, invoice.type, invoice.number);
    doc.fontSize(10).fillColor("#667085").text("KFZ Agani", 50, 118);
    doc.text("Adresse: bitte in den Einstellungen hinterlegen", 50, 133);
    doc.text("Telefon: Platzhalter · E-Mail: platzhalter@kfz-agani.de", 50, 148);
    doc.text("Steuernummer: Platzhalter", 50, 163);

    doc.fillColor("#101820").fontSize(11).font("Helvetica-Bold").text("Kunde", 360, 118);
    doc.font("Helvetica").fontSize(10).text(invoice.customer.name, 360, 136);
    doc.text(invoice.customer.address || "", 360, 151, { width: 180 });
    doc.text(invoice.customer.email || "", 360, 181);

    doc.moveTo(50, 220).lineTo(545, 220).strokeColor("#d0d5dd").stroke();
    doc.fillColor("#101820").font("Helvetica-Bold").fontSize(11).text("Position", 50, 238);
    doc.text("Menge", 330, 238);
    doc.text("Preis", 410, 238);
    doc.text("Gesamt", 490, 238);

    let y = 264;
    invoice.items.forEach((item: any) => {
      const total = item.quantity * item.unitPrice;
      doc.font("Helvetica").fontSize(10).fillColor("#101820").text(item.description, 50, y, { width: 250 });
      doc.text(String(item.quantity).replace(".", ","), 330, y);
      doc.text(currency.format(item.unitPrice), 410, y);
      doc.text(currency.format(total), 490, y);
      y += 28;
    });

    y += 20;
    const net = invoice.laborCost + invoice.partsCost - invoice.discount;
    const vat = net * (invoice.vatRate / 100);
    drawTotal(doc, y, "Arbeitslohn", currency.format(invoice.laborCost));
    drawTotal(doc, y + 18, "Teile", currency.format(invoice.partsCost));
    drawTotal(doc, y + 36, "Rabatt", `-${currency.format(invoice.discount)}`);
    drawTotal(doc, y + 54, `MwSt. ${invoice.vatRate}%`, currency.format(vat));
    doc.roundedRect(330, y + 82, 215, 42, 6).fill("#101820");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13).text("Gesamtbetrag", 346, y + 96);
    doc.text(currency.format(invoice.total), 460, y + 96, { width: 70, align: "right" });

    doc.fillColor("#667085").font("Helvetica").fontSize(9).text(`Datum: ${formatDate(invoice.issuedAt)} · Zahlungsstatus: ${invoice.status}`, 50, 725);
    if (invoice.workOrder?.vehicle) {
      doc.text(`Fahrzeug: ${invoice.workOrder.vehicle.licensePlate} · ${invoice.workOrder.vehicle.brand} ${invoice.workOrder.vehicle.model}`, 50, 740);
    }
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`
    }
  });
}

function drawHeader(doc: PDFKit.PDFDocument, type: string, number: string) {
  doc.rect(0, 0, 595, 92).fill("#101820");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text("WerkstattPlan", 50, 28);
  doc.fillColor("#f5a524").fontSize(9).text("by KFZ Agani", 52, 58);
  doc.fillColor("#ffffff").fontSize(18).text(`${type} ${number}`, 330, 34, { width: 215, align: "right" });
}

function drawTotal(doc: PDFKit.PDFDocument, y: number, label: string, value: string) {
  doc.fillColor("#101820").font("Helvetica").fontSize(10).text(label, 350, y);
  doc.font("Helvetica-Bold").text(value, 460, y, { width: 70, align: "right" });
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
