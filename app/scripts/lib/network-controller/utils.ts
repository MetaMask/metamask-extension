import { escapeRegExp } from 'lodash';
import { generateDeterministicRandomNumber } from '@metamask/remote-feature-flag-controller';
import { QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME } from '../../../../shared/constants/network';
import { ENVIRONMENT } from '../../../../development/build/constants';

/**
 * The amount of Segment RPC service related events to sample in production and
 * release candidate builds.
 */
const SAMPLING_RATE = 0.1;

/**
 * Determines whether the given RPC endpoint URL matches an Infura URL that uses
 * our API key.
 *
 * @param endpointUrl - The URL of the RPC endpoint.
 * @param infuraProjectId - Our Infura project ID.
 * @returns True if the URL is an Infura URL, false otherwise.
 */
export function getIsOurInfuraEndpointUrl(
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
 * Determines whether events should be created in Segment when an RPC endpoint
 * is deemed to be unavailable or degraded.
 *
 * In production and for a release candidate, we sample only 1% of the available
 * events; in development and testing we create every event.
 *
 * @param metaMetricsId - The MetaMetrics ID of the user.
 */
export function shouldCreateRpcServiceEvents(metaMetricsId: string | null) {
  if (
    metaMetricsId === null ||
    process.env.METAMASK_ENVIRONMENT === undefined
  ) {
    return false;
  }

  if (
    [ENVIRONMENT.PRODUCTION, ENVIRONMENT.RELEASE_CANDIDATE].includes(
      process.env.METAMASK_ENVIRONMENT,
    )
  ) {
    return generateDeterministicRandomNumber(metaMetricsId) < SAMPLING_RATE;
  }

  return true;
}
