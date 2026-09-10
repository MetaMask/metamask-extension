import { BridgeAsset, formatChainIdToCaip } from '@metamask/bridge-controller';
import { hexToNumber, CaipAssetType } from '@metamask/utils';
import type { BalanceAwareSwapSourceToken } from '../../../../pages/asset/utils/get-balance-aware-swap-defaults';
import {
  ARC_USDC_TOKEN_ADDRESS,
  CHAIN_IDS,
} from '../../../../../shared/constants/network';
import { toAssetId } from '../../../../../shared/lib/asset-utils';

/**
 * Arc Chain Augmentation Module
 * Contains specific logic that is reused to across the app to augment Arc specific functionality.
 *
 * Listed Augmentations:
 * - Arc does not show the ERC20 token in the UI, instead the ERC20 token is synced with its native token.
 * - E.g. USDC ERC20: 0x3600000000000000000000000000000000000000
 * - E.g. USDC Native: 0x0000000000000000000000000000000000000000
 *
 * - Exception to showing ERC20 token in the UI: Swaps/Bridge flow - as the router has been validated for this token only.
 */
export const ARC_HEX_CHAIN_ID = '0x13b2';
export const ARC_NATIVE_CAIP_CHAIN_ID = 'eip155:5042';
export const ARC_NATIVE_ASSET_ID = 'eip155:5042/slip44:5042';
export const ARC_ERC20_USDC_ASSET_ID =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000';
const ARC_NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

export const ARC_ERC20_USDC_BRIDGE_ASSET: BridgeAsset = {
  symbol: 'USDC',
  name: 'USDC',
  address: '0x3600000000000000000000000000000000000000',
  assetId: ARC_ERC20_USDC_ASSET_ID,
  chainId: hexToNumber(ARC_HEX_CHAIN_ID),
  decimals: 6,
};

/**
 * Whether an asset represents Arc's native USDC balance.
 *
 * The Arc native balance is rendered in the wallet as USDC, but Swaps must use
 * the validated ERC20 wrapper contract.
 *
 * @param asset - Candidate asset.
 * @param asset.address - Asset address.
 * @param asset.assetId - Asset CAIP-19 asset id.
 * @param asset.chainId - Asset chain id.
 * @returns True when the asset is Arc native USDC.
 */
export function isNativeArcAsset(asset: {
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
    (asset.address === '' ||
      asset.address?.toLowerCase() === ARC_NATIVE_ADDRESS)
  ) {
    return true;
  }
  return (
    isArcChainId &&
    'assetId' in asset &&
    asset.assetId?.toLowerCase() === ARC_NATIVE_ASSET_ID
  );
}

/**
 * Whether a token is Arc's ERC20 USDC wrapper used by Swaps.
 *
 * @param token - Token shown on the Token Detail Page.
 * @returns True when the token is Arc wrapper USDC.
 */
export function isArcErc20UsdcSwapToken(
  token: BalanceAwareSwapSourceToken,
): boolean {
  const assetId = toAssetId(token.address, formatChainIdToCaip(token.chainId));

  return assetId === ARC_ERC20_USDC_ASSET_ID;
}

/**
 * Checks whether an asset is the native Arc USDC token supported by the bridge.
 *
 * @param chainId - The chain ID associated with the asset.
 * @param address - The asset's contract address.
 * @param item - The asset metadata.
 * @param item.isNative - Whether the asset is marked as native.
 * @returns Whether the asset is the native Arc USDC bridge token.
 */
export function isArcUsdcForBridge(
  chainId: `0x${string}`,
  address: string,
  item: {
    isNative: boolean;
  },
) {
  return (
    chainId === CHAIN_IDS.ARC &&
    address.toLowerCase() === ARC_USDC_TOKEN_ADDRESS.toLowerCase() &&
    item.isNative
  );
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

/**
 * Checks if a CAIP assetId corresponds to the ERC20 version of USDC on Arc.
 * Which is eip155:5042/erc20:0x3600000000000000000000000000000000000000
 * @param assetId
 * @returns true if input assetId corresponds to the ERC20 version of USDC on Arc.
 */
export function isArcTokenUSDC(assetId: CaipAssetType): boolean {
  return assetId === ARC_ERC20_USDC_BRIDGE_ASSET.assetId;
}
