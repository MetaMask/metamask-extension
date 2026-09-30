export const UNKNOWN_BALANCE = {
  spendableBalance: '',
  withdrawableBalance: '',
  totalBalance: '',
} as const;

/**
 * Parse a raw Perps total balance after removing display separators.
 *
 * @param totalBalance - Raw total balance string from AccountState.
 * @returns The parsed finite number, or null when the value is unresolved.
 */
export function parsePerpsTotalBalance(totalBalance: string): number | null {
  const cleaned = String(totalBalance).replace(/[^0-9.-]/gu, '');
  if (
    cleaned === '' ||
    cleaned === '-' ||
    cleaned === '.' ||
    cleaned === '-.'
  ) {
    return null;
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Whether `totalBalance` is a usable number (including real `$0`).
 * HyperLiquid may return `"--"` or `"NaN"` when DEX queries fail under load.
 *
 * @param totalBalance - Raw total balance string from AccountState.
 * @returns True when the normalized value parses to a finite number.
 */
export function isFinitePerpsTotal(totalBalance: string): boolean {
  return parsePerpsTotalBalance(totalBalance) !== null;
}
