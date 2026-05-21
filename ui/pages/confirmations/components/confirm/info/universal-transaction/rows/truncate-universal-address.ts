const ELLIPSIS = '\u2026';
const PREFIX_LENGTH = 6;
const SUFFIX_LENGTH = 4;

/**
 * Middle-truncate a non-EVM (e.g. Solana base58) address for display.
 *
 * Mirrors the visual style of the EVM AccountFlowRow truncation, without
 * applying any EVM-specific normalization (no checksumming, no lowercasing).
 *
 * @param address - Raw address string.
 * @returns Truncated address, e.g. `C9qwTy...44v`.
 */
export function truncateUniversalAddress(address: string): string {
  if (!address) {
    return '';
  }

  if (address.length <= PREFIX_LENGTH + SUFFIX_LENGTH + 1) {
    return address;
  }

  return `${address.slice(0, PREFIX_LENGTH)}${ELLIPSIS}${address.slice(-SUFFIX_LENGTH)}`;
}
