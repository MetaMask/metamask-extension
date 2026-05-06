import type { AccountState } from '@metamask/perps-controller';

/**
 * Returns the balance available for trading from a perps account.
 * Prefers `withdrawableBalance` (includes unreserved spot USDC for unified
 * accounts), with a defensive fallback to `spendableBalance`.
 *
 * @param account - Perps account state (or null/undefined if not loaded).
 */
export function getTradeableBalance(
  account:
    | Pick<AccountState, 'spendableBalance' | 'withdrawableBalance'>
    | null
    | undefined,
): string {
  return account?.withdrawableBalance ?? account?.spendableBalance ?? '0';
}
