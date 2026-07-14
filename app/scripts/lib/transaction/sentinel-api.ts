import { Hex } from '@metamask/utils';
import type {
  SentinelApiServiceGetNetworksAction,
  SentinelNetwork as SentinelServiceNetwork,
} from '@metamask-previews/sentinel-api-service';
import { hexToDecimal } from '../../../../shared/lib/conversion.utils';

export type SentinelNetwork = SentinelServiceNetwork;

export type SentinelNetworkMap = Record<string, SentinelNetwork>;

/**
 * Minimal messenger able to call the `SentinelApiService:getNetworks` action.
 * Declared structurally so any restricted messenger with that action delegated
 * (or the base controller messenger) can be threaded to these helpers.
 */
export type SentinelNetworksMessenger = {
  call(
    action: SentinelApiServiceGetNetworksAction['type'],
    ...args: Parameters<SentinelApiServiceGetNetworksAction['handler']>
  ): ReturnType<SentinelApiServiceGetNetworksAction['handler']>;
};

/**
 * Returns all network data, keyed by decimal chain ID. Resolves to an empty map
 * if the registry request fails, preserving the previous best-effort behaviour.
 *
 * @param messenger - Messenger used to reach the SentinelApiService.
 */
async function getAllSentinelNetworkFlags(
  messenger: SentinelNetworksMessenger,
): Promise<SentinelNetworkMap> {
  try {
    return await messenger.call('SentinelApiService:getNetworks');
  } catch {
    return {};
  }
}

/**
 * Get Sentinel Network flags by chainId
 *
 * @param messenger - Messenger used to reach the SentinelApiService.
 * @param chainId - The chain ID to get the network flags for.
 * @returns A promise that resolves to the Sentinel network flags for the given chain ID, or undefined if not found.
 */
export async function getSentinelNetworkFlags(
  messenger: SentinelNetworksMessenger,
  chainId: Hex,
): Promise<SentinelNetwork | undefined> {
  const chainIdDecimal = hexToDecimal(chainId);
  const networks = await getAllSentinelNetworkFlags(messenger);
  return networks[chainIdDecimal];
}

/**
 * Returns true if this chain supports sendBundle feature.
 *
 * @param messenger - Messenger used to reach the SentinelApiService.
 * @param chainId - The chain ID to check.
 * @returns A promise that resolves to true if sendBundle is supported, false otherwise.
 */
export async function isSendBundleSupported(
  messenger: SentinelNetworksMessenger,
  chainId: Hex,
): Promise<boolean> {
  const network = await getSentinelNetworkFlags(messenger, chainId);

  if (!network?.sendBundle) {
    return false;
  }

  return true;
}

/**
 * Returns a map of chain IDs to whether sendBundle is supported for each chain.
 *
 * @param messenger - Messenger used to reach the SentinelApiService.
 * @param chainIds - The chain IDs to check.
 * @returns A map of chain IDs to their sendBundle support status.
 */
export async function getSendBundleSupportedChains(
  messenger: SentinelNetworksMessenger,
  chainIds: Hex[],
): Promise<Record<string, boolean>> {
  const networkData = await getAllSentinelNetworkFlags(messenger);

  return chainIds.reduce<Record<string, boolean>>((acc, chainId) => {
    const chainIdDecimal = hexToDecimal(chainId);
    const network = networkData[chainIdDecimal];
    acc[chainId] = network?.sendBundle ?? false;
    return acc;
  }, {});
}
