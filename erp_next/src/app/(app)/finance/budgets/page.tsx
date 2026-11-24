import type { Metadata } from "next";
import { BudgetsView } from "@/features/finance/components/BudgetsView";

export const metadata: Metadata = { title: "Budgeting" };

export default function Page() {
  return <BudgetsView />;
}
