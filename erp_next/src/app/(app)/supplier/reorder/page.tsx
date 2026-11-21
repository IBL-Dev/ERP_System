import type { Metadata } from "next";
import { LowStockView } from "@/features/supplier/components/LowStockView";

export const metadata: Metadata = { title: "Low stock and reordering" };

export default function Page() {
  return <LowStockView />;
}
