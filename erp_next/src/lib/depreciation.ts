const round2 = (n: number) => Math.round(n * 100) / 100;

type Depreciable = { cost: number; salvage: number; lifeYears: number; acquiredOn: string };

/** Straight-line depreciation per month. */
export const monthlyDepreciation = (a: Pick<Depreciable, "cost" | "salvage" | "lifeYears">) =>
  round2((a.cost - a.salvage) / (a.lifeYears * 12));

export const depreciableAmount = (a: Pick<Depreciable, "cost" | "salvage">) => round2(a.cost - a.salvage);

/** Months from `from` to `to`, both "YYYY-MM", counting both ends. 0 when `to` is earlier. */
export function monthsInclusive(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return Math.max(0, (ty - fy) * 12 + (tm - fm) + 1);
}

/** Total depreciation an asset should have by the end of `period` ("YYYY-MM"), never above the depreciable amount. */
export function accumulatedThrough(a: Depreciable, period: string): number {
  const months = monthsInclusive(a.acquiredOn.slice(0, 7), period);
  return Math.min(depreciableAmount(a), round2(months * monthlyDepreciation(a)));
}
