import type { ReactNode } from "react";
import { SalesProvider } from "@/features/sales/SalesProvider";

export default function SalesLayout({ children }: { children: ReactNode }) {
  return <SalesProvider>{children}</SalesProvider>;
}
