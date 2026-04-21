const PERPS_WITHDRAW_SMALL_AMOUNT_DECIMALS = 6;
const PERPS_WITHDRAW_AMOUNT_DECIMALS = 2;
const SMALL_AMOUNT_THRESHOLD = 0.01;

export function formatAmountInputFromNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) {
    return '';
  }
  if (n < SMALL_AMOUNT_THRESHOLD) {
    return n.toFixed(PERPS_WITHDRAW_SMALL_AMOUNT_DECIMALS);
  }
  return n.toFixed(PERPS_WITHDRAW_AMOUNT_DECIMALS);
}
