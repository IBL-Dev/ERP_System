import type { Metadata } from "next";
import { SupplierDetailView } from "@/features/supplier/components/SupplierDetailView";

export const metadata: Metadata = { title: "Supplier" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierDetailView id={decodeURIComponent(id)} />;
}
