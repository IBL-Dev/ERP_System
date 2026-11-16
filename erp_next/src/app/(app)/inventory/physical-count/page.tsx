import type { Metadata } from "next";
import { PhysicalCountView } from "@/features/inventory/components/PhysicalCountView";

export const metadata: Metadata = { title: "Physical count" };

export default function Page() {
  return <PhysicalCountView />;
}
