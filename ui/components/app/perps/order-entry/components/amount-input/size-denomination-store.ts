/**
 * The denomination the user is entering the order size in.
 * - 'usd': value is a USD notional amount (the internal source of truth)
 * - 'asset': value is an asset/token amount (e.g. BTC), derived from USD
 */
export type SizeDenomination = 'usd' | 'asset';

export const DEFAULT_SIZE_DENOMINATION: SizeDenomination = 'usd';

/**
 * In-memory, per-market store for the last-used size denomination.
 *
 * This persists the toggle state within the current session only (it is reset
 * when the extension/service worker restarts). Because the module stays loaded
 * across in-session navigation, returning to the same market restores the
 * denomination the user last selected for it.
 */
const sizeDenominationByAsset = new Map<string, SizeDenomination>();

/**
 * Read the last-used size denomination for a market, defaulting to USD.
 *
 * @param asset - Asset symbol (e.g. 'BTC', 'xyz:BRENTOIL').
 * @returns The stored denomination, or the default ('usd') when none is set.
 */
export function getSizeDenomination(asset: string): SizeDenomination {
  return sizeDenominationByAsset.get(asset) ?? DEFAULT_SIZE_DENOMINATION;
}

/**
 * Persist the size denomination for a market for the rest of the session.
 *
 * @param asset - Asset symbol (e.g. 'BTC', 'xyz:BRENTOIL').
 * @param denomination - The denomination to remember for this market.
 */
export function setSizeDenomination(
  asset: string,
  denomination: SizeDenomination,
): void {
  sizeDenominationByAsset.set(asset, denomination);
}

/**
 * Clear all stored size denominations. Intended for test isolation.
 */
export function resetSizeDenominations(): void {
  sizeDenominationByAsset.clear();
}
