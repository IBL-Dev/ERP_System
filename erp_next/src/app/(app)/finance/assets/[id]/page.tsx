import type { Metadata } from "next";
import { AssetDetailView } from "@/features/finance/components/AssetDetailView";

export const metadata: Metadata = { title: "Asset" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssetDetailView id={decodeURIComponent(id)} />;
}
