/**
 * Pending Activity primary label when crypto amount is not yet known.
 *
 * @param symbol - Token symbol, if any.
 * @returns Ellipsis label, optionally followed by the symbol.
 */
export function formatPendingRampTokenLabel(symbol?: string): string {
  return `...${symbol ? ` ${symbol}` : ''}`;
}
