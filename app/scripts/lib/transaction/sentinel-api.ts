import { Hex } from '@metamask/utils';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';

const BASE_URL = 'https://tx-sentinel-{0}.api.cx.metamask.io/';
const ENDPOINT_NETWORKS = 'networks';

export type SentinelNetwork = {
  name: string;
  group: string;
  chainID: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  network: string;
  explorer: string;
  confirmations: boolean;
  smartTransactions: boolean;
  relayTransactions: boolean;
  hidden: boolean;
  sendBundle: boolean;
};

export type SentinelNetworkMap = Record<string, SentinelNetwork>;

/**
 * Returns all network data.
 */
async function getAllSentinelNetworkFlags(): Promise<SentinelNetworkMap> {
  const url = `${buildUrl('ethereum-mainnet')}${ENDPOINT_NETWORKS}`;
  const response = await getFetchWithTimeout()(url);
  return response.json();
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
 * Returns api base url for a given subdomain.
 *
 * @param subdomain - The subdomain to use in the URL.
 * @returns The complete URL with the subdomain.
 */
export function buildUrl(subdomain: string): string {
  return BASE_URL.replace('{0}', subdomain);
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
