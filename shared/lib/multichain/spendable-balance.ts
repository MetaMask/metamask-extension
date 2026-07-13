import { XlmScope } from '@metamask/keyring-api';
import { BigNumber } from 'bignumber.js';

/**
 * CAIP asset IDs for native assets on chains that expose a protocol-level
 * reserve balance (for example, Stellar's base reserve).
 */
export const NATIVE_RESERVE_SLIP44_IDS: Set<string> = new Set([
  `${XlmScope.Pubnet}/slip44:148`,
]);

/**
 * Computes the spendable balance for a native asset that supports reserve
 * balance display.
 *
 * @param totalBalance - The total balance of the asset.
 * @param baseReserve - The base reserve of the asset.
 * @returns The spendable balance as a string.
 */
export function computeSpendableBalance(
  totalBalance: string,
  baseReserve: string,
): string {
  const total = new BigNumber(totalBalance);
  const reserved = new BigNumber(baseReserve);
  const spendable = total.minus(reserved).toString();
  return spendable;
}

/**
 * Determines whether a native asset exposes a protocol-level reserve balance.
 *
 * @param assetId - CAIP asset ID to check.
 * @returns `true` when the asset is a supported native reserve asset.
 */
export function isSupportBaseReserve(assetId: string): boolean {
  return NATIVE_RESERVE_SLIP44_IDS.has(assetId);
}
