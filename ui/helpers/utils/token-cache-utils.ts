/**
 * Generates a cache key for token scan results
 *
 * @param chainId - The chain ID
 * @param tokenAddress - The token address
 * @returns The cache key in format "chainId:tokenAddress" (both lowercase)
 */
export function generateTokenCacheKey(chainId: string, tokenAddress: string) {
  return `${chainId.toLowerCase()}:${tokenAddress.toLowerCase()}`;
}
