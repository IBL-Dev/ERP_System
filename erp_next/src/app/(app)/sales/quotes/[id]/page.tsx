import type { Metadata } from "next";
import { QuoteDetailView } from "@/features/sales/components/QuoteDetailView";

export const metadata: Metadata = { title: "Quote" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuoteDetailView id={decodeURIComponent(id)} />;
}
