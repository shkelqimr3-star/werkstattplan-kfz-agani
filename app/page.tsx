import { WorkshopApp } from "@/components/workshop-app";
import { demoData } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <WorkshopApp data={demoData()} />;
}
