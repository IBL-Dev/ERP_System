import type { Metadata } from "next";
import { SuppliersView } from "@/features/supplier/components/SuppliersView";

export const metadata: Metadata = { title: "Suppliers" };

export default function Page() {
  return <SuppliersView />;
}
