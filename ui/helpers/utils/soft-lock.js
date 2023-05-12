export function isLockedAsset({
  lockedAssets,
  nft,
  selectedAddress,
  currentNetwork,
}) {
  const { address, tokenId } = nft;
  const assetIdentifier = `eip155:${currentNetwork}/${address}/${tokenId}`;
  return Boolean(lockedAssets?.[selectedAddress]?.[assetIdentifier]);
}
