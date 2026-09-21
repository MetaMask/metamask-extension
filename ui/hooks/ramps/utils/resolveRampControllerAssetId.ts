/**
 * Resolves a CAIP-19 asset id to the ramps catalog's canonical spelling.
 * Ported from mobile's `app/components/UI/Ramp/utils/resolveRampControllerAssetId.ts`.
 *
 * Handles casing (the API lowercases asset ids vs checksummed inputs) and the
 * native token placeholder (`slip44:.` from deep link intents vs the
 * catalog's `slip44:{coinType}`, e.g. `eip155:1/slip44:60`).
 */

/** Token shape from the RampsController token list used for resolving. */
export type TokenForResolve = {
  assetId?: string;
  chainId?: string;
};

/**
 * Resolves an assetId to the catalog's canonical format.
 *
 * @param assetId - Asset ID from URL/param (e.g. `eip155:1/erc20:0x...` or `eip155:1/slip44:.`)
 * @param allTokens - List of tokens from the RampsController (e.g. `selectTokens(state).data?.allTokens`)
 * @returns The catalog's canonical assetId, or the input assetId if no match
 */
export function resolveRampControllerAssetId(
  assetId: string,
  allTokens: TokenForResolve[],
): string {
  const isNative = assetId.includes('/slip44:');
  const [chainId] = assetId.split('/');

  const match = allTokens.find((tok) => {
    if (!tok.assetId) {
      return false;
    }
    if (isNative) {
      return tok.chainId === chainId && tok.assetId.includes('/slip44:');
    }
    return tok.assetId.toLowerCase() === assetId.toLowerCase();
  });

  return match?.assetId ?? assetId;
}
