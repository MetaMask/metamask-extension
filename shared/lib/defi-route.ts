export const DEFI_ROUTE = '/defi';

/**
 * Builds the DeFi protocol details route path.
 *
 * @param chainId - CAIP or hex chain ID for the protocol.
 * @param protocolId - Protocol identifier.
 * @returns Route path for the DeFi details page.
 */
export function buildDefiRoutePath(
  chainId: string,
  protocolId: string,
): string {
  return `${DEFI_ROUTE}/${encodeURIComponent(chainId)}/${encodeURIComponent(protocolId)}`;
}

/**
 * Decodes a DeFi route param that may be URI-encoded.
 *
 * @param value - Raw route param value.
 * @returns Decoded route param value.
 */
export function decodeDefiRouteParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
