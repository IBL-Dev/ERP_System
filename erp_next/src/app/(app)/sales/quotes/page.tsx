import type { Metadata } from "next";
import { QuotesView } from "@/features/sales/components/QuotesView";

export const metadata: Metadata = { title: "Quotes" };

export default function Page() {
  return <QuotesView />;
}
