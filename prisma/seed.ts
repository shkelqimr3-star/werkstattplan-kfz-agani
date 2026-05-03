import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.inspectionItem.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.inspectionPackage.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.workOrderPart.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.part.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.staffUser.deleteMany();

  await prisma.inspectionPackage.createMany({
    data: [
      {
        name: "Basis Check",
        description: "Sicherheitscheck fuer Alltag, Saisonwechsel und schnelle Annahme.",
        basePrice: 39,
        checklist: JSON.stringify(["Lichtanlage", "Reifendruck", "Reifenverschleiss", "Oelstand", "Kuehlmittel", "Sichtpruefung Bremsen"])
      },
      {
        name: "Premium Check",
        description: "Erweiterter Werkstattcheck mit Diagnose, Fahrwerk und Komfortsystemen.",
        basePrice: 89,
        checklist: JSON.stringify(["Lichtanlage", "Reifendruck", "Reifenverschleiss", "Oelstand", "Kuehlmittel", "Sichtpruefung Bremsen", "Batterietest", "OBD Diagnose", "Fahrwerk", "Abgasanlage", "Klimaanlage"])
      },
      {
        name: "Gebrauchtwagen-Check",
        description: "Kaufpruefung mit Fehlerauslese, Chassispruefung, Bremsen, Reifen und Bericht.",
        basePrice: 149,
        checklist: JSON.stringify(["Vollpruefung vor Kauf", "Fehlerscan", "Chassis Check", "Bremszustand", "Reifenzustand", "Leckagepruefung", "Testbericht"])
      }
    ]
  });

  console.log("Seed fertig: leere KFZ Agani Struktur mit Inspektionspaketen, ohne Kundendemo-Daten.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
