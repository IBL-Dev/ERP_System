import type { Metadata } from "next";
import { OverviewView } from "@/features/supplier/components/OverviewView";

export const metadata: Metadata = { title: "Supplier overview" };

export default function Page() {
  return <OverviewView />;
}
