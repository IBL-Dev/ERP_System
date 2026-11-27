import type { Metadata } from "next";
import { CustomerDetailView } from "@/features/sales/components/CustomerDetailView";

export const metadata: Metadata = { title: "Customer" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDetailView id={decodeURIComponent(id)} />;
}
