import type { RampsToken } from '@metamask/ramps-controller';
import { normalizeAssetIdForApi } from './normalizeAssetIdForApi';

/**
 * Resolves a CAIP-19 asset id to the ramps catalog's token (mobile parity):
 * handles casing differences and the `slip44:.` native placeholder.
 *
 * @param assetId - Asset ID from the URL or intent.
 * @param allTokens - Tokens from the RampsController.
 * @returns The matching catalog token, or undefined when none matches.
 */
export function resolveRampControllerToken(
  assetId: string,
  allTokens: RampsToken[],
): RampsToken | undefined {
  const [chainId, assetReference = ''] = assetId.split('/');
  const [namespace, reference = ''] = assetReference.split(':');

  return allTokens.find((token) => {
    const [tokenChainId, tokenReferencePart = ''] = token.assetId.split('/');
    if (tokenChainId !== chainId) {
      return false;
    }
    const [tokenNamespace, tokenReference = ''] = tokenReferencePart.split(':');
    if (namespace === 'slip44') {
      // The `slip44:.` placeholder matches any native coin type; an explicit
      // coin type must match exactly.
      return (
        tokenNamespace === 'slip44' &&
        (reference === '.' || tokenReference === reference)
      );
    }
    // Lowercases EVM ids only; non-EVM namespaces stay case-sensitive.
    return (
      normalizeAssetIdForApi(token.assetId) === normalizeAssetIdForApi(assetId)
    );
  });
}
