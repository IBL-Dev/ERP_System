import type { ReactNode } from "react";
import { FinanceProvider } from "@/features/finance/FinanceProvider";

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return <FinanceProvider>{children}</FinanceProvider>;
}
