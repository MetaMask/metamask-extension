export function normalizeAssetIdForApi(assetId: string | undefined): string {
  if (!assetId) {
    return '';
  }
  if (assetId.startsWith('eip155:')) {
    return assetId.toLowerCase();
  }
  return assetId;
}
