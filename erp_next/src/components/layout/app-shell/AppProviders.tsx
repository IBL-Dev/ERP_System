"use client";

import type { ReactNode } from "react";
import { HrProvider } from "@/features/hr/HrProvider";
import { InventoryProvider } from "@/features/inventory/InventoryProvider";
import { SalesProvider } from "@/features/sales/SalesProvider";
import { SupplierProvider } from "@/features/supplier/SupplierProvider";

/**
 * Company data shared by every department. They sit above the screens, so a change in one
 * department (a shipped order, a confirmed delivery, a finalized payroll) is visible to the others,
 * and Finance can read all of it. Order matters: Sales and Supplier read Inventory.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <InventoryProvider>
      <HrProvider>
        <SalesProvider>
          <SupplierProvider>{children}</SupplierProvider>
        </SalesProvider>
      </HrProvider>
    </InventoryProvider>
  );
}
