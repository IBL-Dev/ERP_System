import type { Metadata } from "next";
import { TrialBalanceView } from "@/features/finance/components/TrialBalanceView";

export const metadata: Metadata = { title: "Trial balance" };

export default function Page() {
  return <TrialBalanceView />;
}
