/**
 * Normalizes an asset id for equality comparisons: EVM ids are lowercased
 * (catalog ids mix checksummed and lowercase spellings, and provider config
 * keys are lowercase), while non-EVM ids (e.g. Solana base58 addresses) are
 * case-sensitive and pass through untouched.
 *
 * Never send the result to the ramps API — asset resolution there is
 * case-sensitive (TRAM-3977), so always pass the catalog's original id
 * verbatim and use this only to compare ids.
 * @param assetId - Asset id to normalize.
 * @returns Normalized id for comparisons, or '' when missing.
 */
export function normalizeAssetIdForComparison(
  assetId: string | undefined,
): string {
  if (!assetId) {
    return '';
  }
  if (assetId.startsWith('eip155:')) {
    return assetId.toLowerCase();
  }
  return assetId;
}
