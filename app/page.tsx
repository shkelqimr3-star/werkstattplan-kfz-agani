import { WorkshopApp } from "@/components/workshop-app";
import { loadAppData } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await loadAppData();
  return <WorkshopApp data={data} />;
}
