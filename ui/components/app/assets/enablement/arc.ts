/**
 * Arc Chain Augmentation Module
 * Contains specific logic that is reused to across the app to augment Arc specific functionality.
 *
 * Listed Augmentations:
 * - Arc does not show the ERC20 token in the UI, instead the ERC20 token is synced with its native token.
 * - E.g. USDC ERC20: 0x0000000000000000000000000000000000000000
 * - E.g. USDC Native: 0x3600000000000000000000000000000000000000
 *
 * - Exception to showing ERC20 token in the UI: Swaps/Bridge flow - as the router has been validated for this token only.
 */
export const ARC_HEX_CHAIN_ID = '0x13b2';
const ARC_NATIVE_CAIP_CHAIN_ID = 'eip155:5042';
const ARC_NATIVE_ASSET_ID =
  'eip155:5042/erc20:0x0000000000000000000000000000000000000000';
const ARC_NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

function isNativeArcAsset(asset: {
  address?: string;
  assetId?: string;
  chainId?: string;
}): boolean {
  const isArcChainId =
    asset.chainId?.toLowerCase() === ARC_HEX_CHAIN_ID ||
    asset.chainId?.toLowerCase() === ARC_NATIVE_CAIP_CHAIN_ID;

  if (
    isArcChainId &&
    'address' in asset &&
    asset.address?.toLowerCase() === ARC_NATIVE_ADDRESS
  ) {
    return true;
  }
  if (
    isArcChainId &&
    'assetId' in asset &&
    asset.assetId?.toLowerCase() === ARC_NATIVE_ASSET_ID
  ) {
    return true;
  }

  return false;
}

/**
 * Filters our Arc Native Asset.
 * Only used for Swaps/Bridge UI - everywhere else uses the ERC20 USDC Asset.
 * @param assets
 * @returns assets without the Arc Native Asset.
 */
export function filterOutArcNativeAsset<
  TAsset extends { chainId?: string; isNative?: boolean },
>(assets: TAsset[]): TAsset[] {
  return assets.filter((asset) => !isNativeArcAsset(asset));
}
