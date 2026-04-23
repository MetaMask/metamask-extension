import BigNumber from 'bignumber.js';

const PERPS_WITHDRAW_SMALL_AMOUNT_DECIMALS = 6;
const PERPS_WITHDRAW_AMOUNT_DECIMALS = 2;
const SMALL_AMOUNT_THRESHOLD = 0.01;

// Truncate (floor) rather than round to guarantee the formatted amount never
// exceeds the caller's input — a round-up from `toFixed` on the 100% preset
// would produce `amountNum > availableBalance` and disable the Continue button.
// Uses BigNumber to sidestep IEEE-754 artifacts (e.g. `0.29 * 100 = 28.999…`).
function truncateToDecimals(n: number, decimals: number): string {
  return new BigNumber(String(n)).toFixed(decimals, BigNumber.ROUND_DOWN);
}

export function formatAmountInputFromNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) {
    return '';
  }
  if (n < SMALL_AMOUNT_THRESHOLD) {
    return truncateToDecimals(n, PERPS_WITHDRAW_SMALL_AMOUNT_DECIMALS);
  }
  return truncateToDecimals(n, PERPS_WITHDRAW_AMOUNT_DECIMALS);
}
