import type { AccountState } from '@metamask/perps-controller';

/**
 * For HyperLiquid unified accounts the controller exposes `availableToTradeBalance`
 * (`withdrawable + unreserved spot USDC`). Non-unified / non-HyperLiquid providers
 * do not set it, so fall back to `availableBalance`.
 *
 * @param account - Perps account state (or null/undefined if not loaded).
 */
export function getTradeableBalance(
  account:
    | Pick<AccountState, 'availableBalance' | 'availableToTradeBalance'>
    | null
    | undefined,
): string {
  return account?.availableToTradeBalance ?? account?.availableBalance ?? '0';
}
