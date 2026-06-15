/**
 * Arc Chain Augmentation Module
 * Contains specific logic that is reused to across the app to augment Arc specific functionality.
 *
 * Listed Augmentations:
 * - Arc does not show the ERC20 token in the UI, instead the ERC20 token is synced with its native token.
 *   - USDC ERC20: 0x0000000000000000000000000000000000000000
 *   - USDC Native: 0x3600000000000000000000000000000000000000
 */
const ARC_NATIVE_CAIP_CHAIN_ID = 'eip155:5042';
const ARC_NATIVE_HEX_CHAIN_ID = '0x13b2';
const ARC_ERC20_USDC_ASSET_ID =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000';
const ARC_ERC20_USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

function isArcErc20USDCAsset(asset: {
  address?: string;
  assetId?: string;
  chainId?: string;
}): boolean {
  const isArcChainId =
    asset.chainId?.toLowerCase() === ARC_NATIVE_HEX_CHAIN_ID ||
    asset.chainId?.toLowerCase() === ARC_NATIVE_CAIP_CHAIN_ID;

  if (
    isArcChainId &&
    'address' in asset &&
    asset.address?.toLowerCase() === ARC_ERC20_USDC_ADDRESS
  ) {
    return true;
  }
  if (
    isArcChainId &&
    'assetId' in asset &&
    asset.assetId?.toLowerCase() === ARC_ERC20_USDC_ASSET_ID
  ) {
    return true;
  }

  return false;
}

export function filterOutArcErc20USDCAsset<
  T extends { chainId?: string; isNative?: boolean },
>(assets: T[]): T[] {
  return assets.filter((asset) => !isArcErc20USDCAsset(asset));
}
