import type { RampsToken } from '@metamask/ramps-controller';
import { normalizeAssetIdForApi } from './normalizeAssetIdForApi';

/**
 * Resolves a CAIP-19 asset id to the ramps catalog's token (ported from
 * mobile's `Ramp/utils/resolveRampControllerAssetId.ts`): casing differences,
 * and the deep-link native `slip44:.` placeholder vs the catalog's
 * `slip44:{coinType}` (e.g. `eip155:1/slip44:60`).
 *
 * @param assetId - Asset ID from URL/param (e.g. `eip155:1/erc20:0x...` or `eip155:1/slip44:.`)
 * @param allTokens - Tokens from the RampsController (e.g. `selectTokens(state).data?.allTokens`)
 * @returns The matching catalog token, or undefined when none matches.
 */
export function resolveRampControllerToken<
  T extends Pick<RampsToken, 'assetId' | 'chainId'>,
>(assetId: string, allTokens: T[]): T | undefined {
  const [chainId, assetReference = ''] = assetId.split('/');
  const [namespace, reference = ''] = assetReference.split(':');

  return allTokens.find((token) => {
    const [tokenChainId, tokenReferencePart = ''] = token.assetId.split('/');
    if (tokenChainId !== chainId) {
      return false;
    }
    const [tokenNamespace, tokenReference = ''] = tokenReferencePart.split(':');
    if (namespace === 'slip44') {
      // Deep links may use the `slip44:.` native placeholder (mobile parity);
      // the catalog spells natives `slip44:{coinType}`. An explicit coin type
      // must match exactly — `eip155:1/slip44:999` is not Ethereum's native
      // asset just because both are slip44 on the same chain.
      return (
        tokenNamespace === 'slip44' &&
        (reference === '.' || tokenReference === reference)
      );
    }
    // `normalizeAssetIdForApi` lowercases EVM asset ids only, so non-EVM
    // (case-sensitive) namespaces compare exactly instead of folding case.
    return (
      normalizeAssetIdForApi(token.assetId) === normalizeAssetIdForApi(assetId)
    );
  });
}
