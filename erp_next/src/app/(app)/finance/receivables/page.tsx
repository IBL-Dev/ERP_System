import type { Metadata } from "next";
import { ReceivablesView } from "@/features/finance/components/ReceivablesView";

export const metadata: Metadata = { title: "Customer billing" };

export default function Page() {
  return <ReceivablesView />;
}
