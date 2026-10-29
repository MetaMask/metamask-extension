import {
  ARC_USDC_TOKEN_ADDRESS,
  CHAIN_IDS,
} from '../../../../../shared/constants/network';

/**
 * Arc Chain Augmentation Module
 * Contains specific logic that is reused to across the app to augment Arc specific functionality.
 *
 * Listed Augmentations:
 * - Arc does not show the ERC20 token in the UI, instead the ERC20 token is synced with its native token.
 * - E.g. USDC ERC20: 0x3600000000000000000000000000000000000000
 * - E.g. USDC Native: 0x0000000000000000000000000000000000000000
 *
 */
export const ARC_HEX_CHAIN_ID = '0x13b2';
export const ARC_NATIVE_CAIP_CHAIN_ID = 'eip155:5042';
export const ARC_NATIVE_ASSET_ID = 'eip155:5042/slip44:5042';

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
