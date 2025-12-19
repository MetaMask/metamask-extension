const TEMPO_CHAIN_IDS = ['0xa5bd'] as const;

/**
 * Determines whether the given chain ID belongs to a Tempo network.
 *
 * @param chainId - The chain ID to check.
 * @returns True if the chain ID is a Tempo network, false otherwise.
 */
export function isTempoNetwork(chainId: string): boolean {
  return TEMPO_CHAIN_IDS.includes(
    chainId.toLowerCase() as (typeof TEMPO_CHAIN_IDS)[number],
  );
}

/**
 * Determines whether a token should be hidden on Tempo networks.
 *
 * @param chainId - The chain ID of the token.
 * @param isNative - Whether the token is marked as native.
 * @param symbol - The token symbol.
 * @returns True if the token should be hidden, false otherwise.
 */
export function shouldHideTempoToken(
  chainId: string,
  isNative: boolean | undefined,
  symbol: string | undefined,
): boolean {
  if (!isTempoNetwork(chainId)) {
    return false;
  }

  if (isNative) {
    return true;
  }

  if (symbol?.toUpperCase() === 'USD') {
    return true;
  }

  return false;
}

