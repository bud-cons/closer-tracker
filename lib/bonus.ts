// Bonus tier: every $100k of Cash Collected in a month adds +1% bonus, no cap.
// $100k-$199,999.99 CC = 1%, $200k-$299,999.99 CC = 2%, $300k-$399,999.99 CC = 3%, etc.
// Cash Collected decides which tier a closer is in (cliff, not marginal —
// the whole month's total, not just the amount in that bracket). The
// resulting percentage is then applied to the closer's monthly Commission
// (not Cash Collected), and that dollar amount is added on top of Commission.
const TIER_SIZE = 100_000;
const TIER_STEP_PERCENT = 0.01;

export function bonusPercentForCashCollected(cashCollected: number): number {
  if (cashCollected < TIER_SIZE) return 0;
  return Math.floor(cashCollected / TIER_SIZE) * TIER_STEP_PERCENT;
}

export function bonusAmountForCommission(commission: number, bonusPercent: number): number {
  return commission * bonusPercent;
}
