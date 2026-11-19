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
  return getTradeableBalanceRaw(account) ?? '0';
}

/**
 * Same resolution as `getTradeableBalance` but without the `'0'` fallback, so
 * callers can tell "the provider reported no balance field" apart from "the
 * account holds zero collateral". Surfaces that act on an unfunded balance need
 * that distinction; everything else should keep using `getTradeableBalance`.
 *
 * @param account - Perps account state (or null/undefined if not loaded).
 */
export function getTradeableBalanceRaw(
  account:
    | Pick<AccountState, 'spendableBalance' | 'withdrawableBalance'>
    | null
    | undefined,
): string | undefined {
  return account?.withdrawableBalance ?? account?.spendableBalance;
}
