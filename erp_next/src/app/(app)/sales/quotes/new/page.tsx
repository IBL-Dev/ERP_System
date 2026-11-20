import type { Metadata } from "next";
import { QuoteBuilderView } from "@/features/sales/components/QuoteBuilderView";

export const metadata: Metadata = { title: "New quote" };

export default function Page() {
  return <QuoteBuilderView />;
}
