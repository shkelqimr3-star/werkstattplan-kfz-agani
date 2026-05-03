import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { cookies } from "next/headers";
import { COOKIE_NAME, readSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = readSession(cookies().get(COOKIE_NAME)?.value);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Nur Admins duerfen exportieren." }, { status: 403 });
  const db = getDb();
  try {
    const orders = await db.workOrder.findMany({ include: { customer: true, vehicle: true, parts: true }, orderBy: { createdAt: "desc" } });
    const pdf = await new Promise<Buffer>((resolve) => {
      const doc = new PDFDocument({ size: "A4", margin: 44 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.rect(0, 0, 595, 88).fill("#101820");
      doc.fillColor("#fff").font("Helvetica-Bold").fontSize(22).text("WerkstattPlan", 44, 28);
      doc.fillColor("#f5a524").fontSize(9).text("KFZ Agani Arbeitsauftraege", 46, 56);
      let y = 120;
      orders.forEach((order: any) => {
        if (y > 720) {
          doc.addPage();
          y = 60;
        }
        doc.fillColor("#101820").font("Helvetica-Bold").fontSize(12).text(`${order.number} · ${order.vehicle.licensePlate}`, 44, y);
        doc.font("Helvetica").fontSize(9).fillColor("#667085").text(`${order.customer.name} · ${order.status} · ${formatDate(order.createdAt)}`, 44, y + 16);
        doc.fillColor("#101820").text(order.customerComplaint || "", 44, y + 34, { width: 500 });
        y += 76;
      });
      if (orders.length === 0) {
        doc.fillColor("#101820").font("Helvetica-Bold").fontSize(14).text("Keine Arbeitsauftraege vorhanden.", 44, 140);
      }
      doc.end();
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="werkstattplan-arbeitsauftraege.pdf"'
      }
    });
  } finally {
    await db.$disconnect();
  }
}
