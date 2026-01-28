import { escapeRegExp } from 'lodash';
import { BUILT_IN_CUSTOM_NETWORKS_RPC } from '@metamask/controller-utils';
import {
  CHAIN_SPEC_URL,
  FEATURED_RPCS,
  QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
} from '../constants/network';
import { getStorageItem } from './storage-helpers';

const cacheKey = `cachedFetch:${CHAIN_SPEC_URL}`;

// Cache for known domains from eth-chainlist
let knownDomainsSet: Set<string> | null = null;
let initPromise: Promise<void> | null = null;

type ChainInfo = {
  name: string;
  shortName?: string;
  chainId: number;
  rpc?: string[];
};

/**
 * The list of unofficial endpoints that we allow users to add easily.
 */
const FEATURED_RPC_ENDPOINTS = FEATURED_RPCS.flatMap((networkConfiguration) =>
  networkConfiguration.rpcEndpoints.map((rpcEndpoint) => ({
    name: rpcEndpoint.name ?? networkConfiguration.name,
    url: rpcEndpoint.url,
  })),
);

/**
 * The list of unofficial endpoints that can be added as default networks.
 */
const BUILT_IN_CUSTOM_ENDPOINTS = Object.entries(
  BUILT_IN_CUSTOM_NETWORKS_RPC,
).map(([name, url]) => ({ name, url }));

/**
 * The list of known unofficial endpoint URLs.
 */
const KNOWN_CUSTOM_ENDPOINT_URLS = [
  ...FEATURED_RPC_ENDPOINTS,
  ...BUILT_IN_CUSTOM_ENDPOINTS,
].map(({ url }) => url);

/**
 * Get chains list from cache only without making network requests. This
 * function is temporary and will be replaced the work being done in PR
 * https://github.com/MetaMask/metamask-extension/pull/32297
 */
export async function getSafeChainsListFromCacheOnly(): Promise<ChainInfo[]> {
  try {
    const { cachedResponse } = (await getStorageItem(cacheKey)) || {};
    return cachedResponse || [];
  } catch (error) {
    console.error('Error retrieving chains list from cache', error);
    return [];
  }
}

/**
 * Determines whether the given RPC endpoint URL matches an Infura URL that uses
 * our API key.
 *
 * @param endpointUrl - The URL of the RPC endpoint.
 * @param infuraProjectId - Our Infura project ID.
 * @returns True if the URL is an Infura URL, false otherwise.
 */
export function getIsMetaMaskInfuraEndpointUrl(
  endpointUrl: string,
  infuraProjectId: string,
): boolean {
  return new RegExp(
    `^https://[^.]+\\.infura\\.io/v3/(?:\\{infuraProjectId\\}|${escapeRegExp(infuraProjectId)})$`,
    'u',
  ).test(endpointUrl);
}

/**
 * Determines whether the given RPC endpoint URL matches a known Quicknode URL.
 *
 * @param endpointUrl - The URL of the RPC endpoint.
 * @returns True if the URL is a Quicknode URL, false otherwise.
 */
export function getIsQuicknodeEndpointUrl(endpointUrl: string): boolean {
  return Object.values(QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME)
    .map((getUrl) => getUrl())
    .includes(endpointUrl);
}

/**
 * Some URLs that users add as networks refer to private servers, and we do not
 * want to report these in Segment (or any other data collection service). This
 * function returns whether the given RPC endpoint is safe to share.
 *
 * @param endpointUrl - The URL of the endpoint.
 * @param infuraProjectId - Our Infura project ID.
 * @returns True if the endpoint URL is safe to share with external data
 * collection services, false otherwise.
 */
export function isPublicEndpointUrl(
  endpointUrl: string,
  infuraProjectId: string,
) {
  const isMetaMaskInfuraEndpointUrl = getIsMetaMaskInfuraEndpointUrl(
    endpointUrl,
    infuraProjectId,
  );
  const isQuicknodeEndpointUrl = getIsQuicknodeEndpointUrl(endpointUrl);
  const isKnownCustomEndpointUrl =
    KNOWN_CUSTOM_ENDPOINT_URLS.includes(endpointUrl);
  const isChainlistEndpoint = isChainlistEndpointUrl(endpointUrl);

  return (
    isMetaMaskInfuraEndpointUrl ||
    isQuicknodeEndpointUrl ||
    isKnownCustomEndpointUrl ||
    isChainlistEndpoint
  );
}

/**
 * Extracts the hostname from a URL.
 *
 * @param url - The URL to extract the hostname from.
 * @returns The lowercase hostname, or null if the URL is invalid.
 */
function extractHostname(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Initialize the set of known domains from the eth-chainlist cache.
 * This should be called once at startup in the background context only.
 * The UI should NOT call this to avoid the ~300KB memory footprint.
 * When not initialized, isChainlistDomain() returns false, which means
 * isPublicEndpointUrl() falls back to checking Infura, Quicknode, and
 * known custom endpoints only.
 *
 * @returns A promise that resolves when initialization is complete.
 */
export async function initializeChainlistDomains(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const chainsList = await getSafeChainsListFromCacheOnly();
      knownDomainsSet = new Set<string>();

      for (const chain of chainsList) {
        if (chain.rpc && Array.isArray(chain.rpc)) {
          for (const rpcUrl of chain.rpc) {
            const hostname = extractHostname(rpcUrl);
            if (hostname) {
              knownDomainsSet.add(hostname);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error initializing chainlist domains:', error);
      knownDomainsSet = new Set<string>();
    }
  })();

  return initPromise;
}

/**
 * Check if a domain is in the eth-chainlist (cached).
 *
 * @param domain - The domain to check.
 * @returns True if the domain is found in the chainlist cache.
 */
export function isChainlistDomain(domain: string): boolean {
  if (!domain) {
    return false;
  }
  return knownDomainsSet?.has(domain.toLowerCase()) ?? false;
}

/**
 * Check if an RPC endpoint URL's domain is defined in eth-chainlist.
 *
 * @param endpointUrl - The URL of the RPC endpoint.
 * @returns True if the endpoint's domain is in the chainlist.
 */
export function isChainlistEndpointUrl(endpointUrl: string): boolean {
  const hostname = extractHostname(endpointUrl);
  if (!hostname) {
    return false;
  }
  return isChainlistDomain(hostname);
}

/**
 * Resets the chainlist domains cache. Useful for testing.
 */
export function resetChainlistDomainsCache(): void {
  knownDomainsSet = null;
  initPromise = null;
}
