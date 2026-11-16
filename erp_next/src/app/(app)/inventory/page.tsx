import type { Metadata } from "next";
import { OverviewView } from "@/features/inventory/components/OverviewView";

export const metadata: Metadata = { title: "Inventory overview" };

export default function Page() {
  return <OverviewView />;
}
