import type { Metadata } from "next";
import { AccountsView } from "@/features/finance/components/AccountsView";

export const metadata: Metadata = { title: "Chart of accounts" };

export default function Page() {
  return <AccountsView />;
}
