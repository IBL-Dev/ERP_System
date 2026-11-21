"use client";

import Link from "next/link";
import { ROUTES } from "@/common/const";
import { useSales } from "../SalesProvider";

/** Customer name that links to the customer profile. */
export function CustomerLink({ id, showContact = false }: { id: string; showContact?: boolean }) {
  const { customersById } = useSales();
  const customer = customersById[id];
  if (!customer) return <span className="text-ink-muted">{id}</span>;
  return (
    <div>
      <Link
        href={ROUTES.sales.customer(customer.id)}
        className="font-medium text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {customer.name}
      </Link>
      {showContact && <p className="text-xs text-ink-muted">{customer.contact}</p>}
    </div>
  );
}
