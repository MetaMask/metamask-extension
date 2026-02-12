import { isConnectionError } from '@metamask/network-controller';
import { generateDeterministicRandomNumber } from '@metamask/remote-feature-flag-controller';
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
 * Events should only be created in Segment when an RPC endpoint is detected to
 * be degraded or unavailable if:
 *
 * - The RPC endpoint is slow
 * - The user does not have local connectivity issues
 * - The user is in the MetaMetrics sample
 *
 * @param args - The arguments.
 * @param args.error - The connection or response error encountered after making
 * a request to the RPC endpoint.
 * @param args.metaMetricsId - The MetaMetrics ID of the user.
 * @returns True if Segment events should be created, false otherwise.
 */
export function shouldCreateRpcServiceEvents({
  error,
  metaMetricsId,
}: {
  error?: unknown;
  metaMetricsId: string | null | undefined;
}) {
  return (
    (!error || !isConnectionError(error)) &&
    metaMetricsId !== undefined &&
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
