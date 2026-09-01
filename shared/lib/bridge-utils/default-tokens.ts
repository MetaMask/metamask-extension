import {
  type BridgeAssetV2,
  formatChainIdToCaip,
  formatChainIdToDec,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { BRIDGE_CHAINID_TO_DEFAULT_FROM_TOKEN } from '../../constants/bridge';

export type DefaultBridgeFromToken = Pick<
  BridgeAssetV2,
  'assetId' | 'decimals' | 'name' | 'symbol'
> & {
  address: string;
  chainId: number;
};

/**
 * Returns the default source token for the bridge and swap experience.
 * A chain-specific token override is preferred when configured; otherwise the
 * chain's native asset is returned.
 *
 * @param chainId - A chain ID supported by the bridge controller.
 * @returns The default source token for the chain.
 */
export function getDefaultBridgeFromToken(
  chainId: Parameters<typeof formatChainIdToCaip>[0],
): DefaultBridgeFromToken {
  const caipChainId = formatChainIdToCaip(chainId);
  const override =
    BRIDGE_CHAINID_TO_DEFAULT_FROM_TOKEN[
      caipChainId as keyof typeof BRIDGE_CHAINID_TO_DEFAULT_FROM_TOKEN
    ];

  if (override) {
    return {
      ...override,
      chainId: formatChainIdToDec(chainId),
    };
  }

  return getNativeAssetForChainId(chainId);
}
