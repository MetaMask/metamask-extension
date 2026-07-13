import type { V6BalanceItem } from '@metamask/core-backend';

/**
 * Returns the human-readable token balance from a v6 balance row.
 *
 * @param balance - Balance row from the v6 multiaccount balances API.
 * @returns Parsed balance amount, or 0 when invalid.
 */
export function getNormalizedV6Balance(balance: V6BalanceItem): number {
  const normalizedBalance = Number.parseFloat(balance.balance);

  return Number.isFinite(normalizedBalance) ? normalizedBalance : 0;
}

/**
 * Returns the fiat market value for a v6 DeFi balance row.
 *
 * @param balance - Balance row from the v6 multiaccount balances API.
 * @returns Fiat value in the requested currency, or 0 when unavailable.
 */
export function getDefiPositionMarketValue(balance: V6BalanceItem): number {
  const normalizedBalance = getNormalizedV6Balance(balance);
  const price = Number.parseFloat(balance.price ?? '0');

  if (!Number.isFinite(price)) {
    return 0;
  }

  return normalizedBalance * price;
}
