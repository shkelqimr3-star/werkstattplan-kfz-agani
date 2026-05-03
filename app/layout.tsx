import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WerkstattPlan by KFZ Agani",
  description: "Professionelle Werkstattverwaltung fuer KFZ Agani."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
