/**
 * SAMPLE payroll rules. Rates and slabs differ by country and company:
 * replace these values with your own (later they can come from a settings screen or API).
 */
export const PAYROLL_RULES = {
  periodLabel: "November 2026",
  periodStart: "2026-11-01",
  periodEnd: "2026-11-30",
  workingDays: 21,
  hoursPerDay: 8,
  overtimeMultiplier: 1.5,
  /** Fixed monthly allowance paid to every employee. */
  allowance: 100,
  /** Share of basic salary the employee pays into the pension fund. */
  pensionRate: 0.08,
  /** Monthly income tax slabs, applied to the part of income inside each slab. */
  taxSlabs: [
    { upTo: 1000, rate: 0 },
    { upTo: 2500, rate: 0.06 },
    { upTo: 4000, rate: 0.12 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.18 },
  ],
} as const;
