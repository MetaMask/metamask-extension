import type { AccountState } from '@metamask/perps-controller';

/**
 * Returns the controller-normalized balance available for Perps trading/funding surfaces.
 * For current providers, `withdrawableBalance` and `spendableBalance` resolve to
 * the same value: HL Unified folds free spot USDC into both, HL Standard uses
 * withdrawable collateral, and MYX uses wallet balance.
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
