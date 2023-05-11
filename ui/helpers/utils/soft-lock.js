export function isLockedAsset({
  lockedAssets,
  nft,
  selectedAddress,
  currentNetwork,
}) {
  const { standard, address, tokenId } = nft;
  const assetIdentifier = `eip155:${currentNetwork}/${standard}:${address}/${tokenId}`;
  return Boolean(lockedAssets?.[selectedAddress]?.[assetIdentifier]);
}
