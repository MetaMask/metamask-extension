import { isConnectionError } from '@metamask/network-controller';
import { generateDeterministicRandomNumber } from '@metamask/remote-feature-flag-controller';
import { ENVIRONMENT } from '../../../../shared/constants/build';

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
 * - The user is in the Analytics sample
 *
 * @param args - The arguments.
 * @param args.error - The connection or response error encountered after making
 * a request to the RPC endpoint.
 * @param args.analyticsId - The analytics ID of the user.
 * @returns True if Segment events should be created, false otherwise.
 */
export function shouldCreateRpcServiceEvents({
  error,
  analyticsId,
}: {
  error?: unknown;
  analyticsId: string | null | undefined;
}) {
  return (
    (!error || !isConnectionError(error)) &&
    analyticsId !== undefined &&
    analyticsId !== null &&
    isSamplingAnalyticsUser(analyticsId)
  );
}

/**
 * Determines whether the user is included in the sample for Analytics.
 *
 * In production and for a release candidate, we sample only 1% of the available
 * events; in development and testing we create every event.
 *
 * @param analyticsId - The analytics ID of the user.
 * @returns True if the user is included in the sample for Analytics, false
 * otherwise.
 */
function isSamplingAnalyticsUser(analyticsId: string) {
  if (process.env.METAMASK_ENVIRONMENT === undefined) {
    return false;
  }

  if (PRODUCTION_LIKE_ENVIRONMENTS.includes(process.env.METAMASK_ENVIRONMENT)) {
    return generateDeterministicRandomNumber(analyticsId) < SAMPLING_RATE;
  }

  return true;
}
