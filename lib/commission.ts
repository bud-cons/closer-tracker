// Per-deal commission tier: 10% on the first $9,999.99 of Cash Collected on
// that appointment, 11% for $10k-$19,999.99, 12% for $20k-$29,999.99, 13% for
// $30k-$39,999.99, and +1% every $10k after that, no cap. Cliff, not
// marginal — the whole deal's Cash Collected is taxed at the rate for the
// bracket it falls into, same style as the monthly bonus tier in bonus.ts.
const TIER_SIZE = 10_000;
const BASE_RATE = 0.1;
const RATE_STEP = 0.01;

export function commissionRateForCashCollected(cashCollected: number): number {
  if (cashCollected <= 0) return BASE_RATE;
  const tier = Math.floor(cashCollected / TIER_SIZE);
  return BASE_RATE + tier * RATE_STEP;
}

export function calculateCommission(cashCollected: number): number {
  const raw = cashCollected * commissionRateForCashCollected(cashCollected);
  return Math.round(raw * 100) / 100;
}
