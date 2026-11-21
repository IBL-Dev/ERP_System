import { PRICE_LIST, TIER_DISCOUNT_PCT } from "@/common/const";
import type { CustomerTier, PriceBreak, QuoteLine } from "@/common/type";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The price break that applies to `qty` units of `sku`, or null if the SKU has no price list. */
export function priceBreakFor(sku: string, qty: number): PriceBreak | null {
  const breaks = PRICE_LIST[sku];
  if (!breaks?.length) return null;
  let applied = breaks[0];
  for (const b of breaks) if (qty >= b.minQty) applied = b;
  return applied;
}

/** Snapshot of the price for one quote line: quantity tier price plus the customer tier discount. */
export function buildQuoteLine(sku: string, qty: number, tier: CustomerTier): QuoteLine {
  return { sku, qty, unitPrice: priceBreakFor(sku, qty)?.unitPrice ?? 0, discountPct: TIER_DISCOUNT_PCT[tier] };
}

export const lineSubtotal = (l: QuoteLine) => round2(l.qty * l.unitPrice);
export const lineTotal = (l: QuoteLine) => round2(l.qty * l.unitPrice * (1 - l.discountPct / 100));

export const linesSubtotal = (lines: QuoteLine[]) => round2(lines.reduce((t, l) => t + lineSubtotal(l), 0));
export const linesTotal = (lines: QuoteLine[]) => round2(lines.reduce((t, l) => t + lineTotal(l), 0));
