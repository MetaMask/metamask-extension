import { Hex } from '@metamask/utils';
import { hexToDecimal } from '../../../../shared/lib/conversion.utils';
import { getSentinelApiService } from './sentinel-api-service';
import type { SentinelNetwork as SentinelServiceNetwork } from '@metamask/sentinel-api-service';

export { setSentinelApiAuth } from './sentinel-api-service';

export type SentinelNetwork = SentinelServiceNetwork;

export type SentinelNetworkMap = Record<string, SentinelNetwork>;

/**
 * Returns all network data, keyed by decimal chain ID. Resolves to an empty map
 * if the registry request fails, preserving the previous best-effort behaviour.
 */
async function getAllSentinelNetworkFlags(): Promise<SentinelNetworkMap> {
  try {
    return await getSentinelApiService().getNetworks();
  } catch {
    return {};
  }
}

/**
 * Get Sentinel Network flags by chainId
 *
 * @param chainId - The chain ID to get the network flags for.
 * @returns A promise that resolves to the Sentinel network flags for the given chain ID, or undefined if not found.
 */
export async function getSentinelNetworkFlags(
  chainId: Hex,
): Promise<SentinelNetwork | undefined> {
  const chainIdDecimal = hexToDecimal(chainId);
  const networks = await getAllSentinelNetworkFlags();
  return networks[chainIdDecimal];
}

/**
 * Returns true if this chain supports sendBundle feature.
 *
 * @param chainId - The chain ID to check.
 * @returns A promise that resolves to true if sendBundle is supported, false otherwise.
 */
export async function isSendBundleSupported(chainId: Hex): Promise<boolean> {
  const network = await getSentinelNetworkFlags(chainId);

  if (!network?.sendBundle) {
    return false;
  }

  return true;
}

/**
 * Returns a map of chain IDs to whether sendBundle is supported for each chain.
 *
 * @param chainIds - The chain IDs to check.
 * @returns A map of chain IDs to their sendBundle support status.
 */
export async function getSendBundleSupportedChains(
  chainIds: Hex[],
): Promise<Record<string, boolean>> {
  const networkData = await getAllSentinelNetworkFlags();

  return chainIds.reduce<Record<string, boolean>>((acc, chainId) => {
    const chainIdDecimal = hexToDecimal(chainId);
    const network = networkData[chainIdDecimal];
    acc[chainId] = network?.sendBundle ?? false;
    return acc;
  }, {});
}
