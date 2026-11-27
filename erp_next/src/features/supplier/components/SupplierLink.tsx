"use client";

import Link from "next/link";
import { ROUTES } from "@/common/const";
import { useSupplier } from "../SupplierProvider";

/** Supplier name that links to the supplier profile. */
export function SupplierLink({ id, showContact = false }: { id: string; showContact?: boolean }) {
  const { suppliersById } = useSupplier();
  const supplier = suppliersById[id];
  if (!supplier) return <span className="text-ink-muted">{id}</span>;
  return (
    <div>
      <Link
        href={ROUTES.supplier.supplier(supplier.id)}
        className="font-medium text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {supplier.name}
      </Link>
      {showContact && <p className="text-xs text-ink-muted">{supplier.contact}</p>}
    </div>
  );
}
