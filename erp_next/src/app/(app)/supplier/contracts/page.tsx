import type { Metadata } from "next";
import { ContractsView } from "@/features/supplier/components/ContractsView";

export const metadata: Metadata = { title: "Contracts" };

export default function Page() {
  return <ContractsView />;
}
