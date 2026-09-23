// Resolves a CAIP-19 asset id to the ramps catalog's canonical spelling
// (ported from mobile's `Ramp/utils/resolveRampControllerAssetId.ts`): casing
// differences, and the native `slip44:.` placeholder vs the catalog's
// `slip44:{coinType}` (e.g. `eip155:1/slip44:60`).

/** Token shape from the RampsController token list used for resolving. */
export type TokenForResolve = {
  assetId?: string;
  chainId?: string;
};

/**
 * Resolves an assetId to the catalog's canonical format.
 *
 * @param assetId - Asset ID from URL/param (e.g. `eip155:1/erc20:0x...` or `eip155:1/slip44:.`)
 * @param allTokens - Tokens from the RampsController (e.g. `selectTokens(state).data?.allTokens`)
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
