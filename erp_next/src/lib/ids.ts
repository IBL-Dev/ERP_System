/** Next id like Q-2017 or PO-4506: the highest number already used (at least `fallback`), plus one. */
export function nextNumber(ids: string[], fallback: number): number {
  const numbers = ids.map((id) => Number(id.split("-")[1])).filter((n) => Number.isFinite(n));
  return Math.max(fallback, ...numbers) + 1;
}
