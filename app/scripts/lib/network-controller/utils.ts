import { isConnectionError } from '@metamask/network-controller';
import { generateDeterministicRandomNumber } from '@metamask/remote-feature-flag-controller';
import { QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME } from '../../../../shared/constants/network';
import { ENVIRONMENT } from '../../../../development/build/constants';

/**
 * The amount of Segment RPC service related events to sample in production and
 * release candidate builds.
 */
const SAMPLING_RATE = 0.01;

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
 * @param error - The error from requesting the endpoint.
 * @param metaMetricsId - The MetaMetrics ID of the user.
 */
export function shouldCreateRpcServiceEvents(
  error: unknown,
  metaMetricsId: string | null,
) {
  return (
    (!error || !isConnectionError(error)) &&
    metaMetricsId !== null &&
    isSamplingMetaMetricsUser(metaMetricsId)
  );
}

/**
 * Determines whether the user is included in the sample for MetaMetrics.
 *
 * In production and for a release candidate, we sample only 1% of the available
 * events; in development and testing we create every event.
 *
 * @param metaMetricsId - The MetaMetrics ID of the user.
 */
function isSamplingMetaMetricsUser(metaMetricsId: string) {
  if (process.env.METAMASK_ENVIRONMENT === undefined) {
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
