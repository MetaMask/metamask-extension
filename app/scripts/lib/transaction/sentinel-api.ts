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
export async function getNetworkData(): Promise<SentinelNetworkMap> {
  const url = `${buildUrl('ethereum-mainnet')}${ENDPOINT_NETWORKS}`;
  const response = await getFetchWithTimeout()(url);
  return response.json();
}

/**
 * Get Sentinel Network data by chainId
 *
 * @param chainId - The chain ID to get the network data for.
 * @returns A promise that resolves to the Sentinel network data for the given chain ID, or undefined if not found.
 */
export async function getNetworkDataByChainId(
  chainId: Hex,
): Promise<SentinelNetwork | undefined> {
  const chainIdDecimal = hexToDecimal(chainId);
  const networks = await getNetworkData();
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
