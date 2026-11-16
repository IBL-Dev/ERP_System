import type { ReactNode } from "react";
import { InventoryProvider } from "@/features/inventory/InventoryProvider";

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return <InventoryProvider>{children}</InventoryProvider>;
}
