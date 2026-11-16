import type { Metadata } from "next";
import { GoalsView } from "@/features/hr/components/GoalsView";

export const metadata: Metadata = { title: "Goals" };

export default function Page() {
  return <GoalsView />;
}
