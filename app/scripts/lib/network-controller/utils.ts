import { escapeRegExp } from 'lodash';
import { isConnectionError } from '@metamask/network-controller';
import { generateDeterministicRandomNumber } from '@metamask/remote-feature-flag-controller';
import { BUILT_IN_CUSTOM_NETWORKS_RPC } from '@metamask/controller-utils';
import {
  FEATURED_RPCS,
  QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
} from '../../../../shared/constants/network';
import { ENVIRONMENT } from '../../../../development/build/constants';

/**
 * We capture Segment events for degraded or unavailable RPC endpoints for 1%
 * of our userbase.
 */
const SAMPLING_RATE = 0.01;

/**
 * Environments that are expected to resemble production, or production itself.
 */
export const PRODUCTION_LIKE_ENVIRONMENTS = [
  ENVIRONMENT.PRODUCTION,
  ENVIRONMENT.RELEASE_CANDIDATE,
];

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
 * The list of known unofficial endpoints.
 */
export const KNOWN_CUSTOM_ENDPOINTS = [
  ...FEATURED_RPC_ENDPOINTS,
  ...BUILT_IN_CUSTOM_ENDPOINTS,
];

/**
 * The list of known unofficial endpoints.
 */
const KNOWN_CUSTOM_ENDPOINT_URLS = KNOWN_CUSTOM_ENDPOINTS.map(({ url }) => url);

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
    `^https://[^.]+\\.infura\\.io/v3/${escapeRegExp(infuraProjectId)}$`,
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
 * Events should only be created in Segment when an RPC endpoint is detected to
 * be degraded or unavailable if:
 *
 * - The RPC endpoint is slow
 * - The user does not have local connectivity issues
 * - The user is in the MetaMetrics sample
 * - Capturing the endpoint URL in Segment would not violate the user's privacy
 *
 * @param args - The arguments.
 * @param args.endpointUrl - The URL of the endpoint.
 * @param args.error - The connection or response error encountered after making
 * a request to the RPC endpoint.
 * @param args.infuraProjectId - Our Infura project ID.
 * @param args.metaMetricsId - The MetaMetrics ID of the user.
 * @returns True if Segment events should be created, false otherwise.
 */
export function shouldCreateRpcServiceEvents({
  endpointUrl,
  error,
  infuraProjectId,
  metaMetricsId,
}: {
  endpointUrl: string;
  error?: unknown;
  infuraProjectId: string;
  metaMetricsId: string | null | undefined;
}) {
  return (
    (!error || !isConnectionError(error)) &&
    metaMetricsId !== undefined &&
    metaMetricsId !== null &&
    isSamplingMetaMetricsUser(metaMetricsId) &&
    isPublicEndpointUrl(endpointUrl, infuraProjectId)
  );
}

/**
 * Determines whether the user is included in the sample for MetaMetrics.
 *
 * In production and for a release candidate, we sample only 1% of the available
 * events; in development and testing we create every event.
 *
 * @param metaMetricsId - The MetaMetrics ID of the user.
 * @returns True if the user is included in the sample for MetaMetrics, false
 * otherwise.
 */
function isSamplingMetaMetricsUser(metaMetricsId: string) {
  if (process.env.METAMASK_ENVIRONMENT === undefined) {
    return false;
  }

  if (PRODUCTION_LIKE_ENVIRONMENTS.includes(process.env.METAMASK_ENVIRONMENT)) {
    return generateDeterministicRandomNumber(metaMetricsId) < SAMPLING_RATE;
  }

  return true;
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
function isPublicEndpointUrl(endpointUrl: string, infuraProjectId: string) {
  const isMetaMaskInfuraEndpointUrl = getIsMetaMaskInfuraEndpointUrl(
    endpointUrl,
    infuraProjectId,
  );
  const isQuicknodeEndpointUrl = getIsQuicknodeEndpointUrl(endpointUrl);
  const isKnownCustomEndpointUrl =
    KNOWN_CUSTOM_ENDPOINT_URLS.includes(endpointUrl);

  return (
    isMetaMaskInfuraEndpointUrl ||
    isQuicknodeEndpointUrl ||
    isKnownCustomEndpointUrl
  );
}
