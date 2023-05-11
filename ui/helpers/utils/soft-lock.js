export function isLockedAsset({
  lockedAssets,
  selectedAddress,
  currentNetwork,
  standard,
  address,
  tokenId,
}) {

  const assetIdentifier = `eip155:${currentNetwork}/${standard}:${address}/${tokenId}`;

  return Boolean(lockedAssets?.[selectedAddress]?.[assetIdentifier]);
}
