import type { ReactNode } from "react";
import { SupplierProvider } from "@/features/supplier/SupplierProvider";

export default function SupplierLayout({ children }: { children: ReactNode }) {
  return <SupplierProvider>{children}</SupplierProvider>;
}
