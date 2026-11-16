import type { Metadata } from "next";
import { TrainingView } from "@/features/hr/components/TrainingView";

export const metadata: Metadata = { title: "Training" };

export default function Page() {
  return <TrainingView />;
}
