import { ENVIRONMENT } from '../../../../shared/constants/build';

/**
 * Environments that are expected to resemble production, or production itself.
 */
export const PRODUCTION_LIKE_ENVIRONMENTS = [
  ENVIRONMENT.PRODUCTION,
  ENVIRONMENT.RELEASE_CANDIDATE,
];

/**
 * The proportion of RPC service events (degraded/unavailable) that
 * `NetworkController` should emit, passed as the `rpcServiceEventsSampleRate`
 * analytics option.
 *
 * In production and for a release candidate we sample only 1% of events; in
 * development and testing we emit every event; when the environment is unknown
 * we emit none. The controller applies this rate deterministically per user, so
 * the same user is consistently in or out of the sample.
 *
 * @returns The sample rate, between 0 and 1.
 */
export function getRpcServiceEventsSampleRate(): number {
  if (process.env.METAMASK_ENVIRONMENT === undefined) {
    return 0;
  }

  if (PRODUCTION_LIKE_ENVIRONMENTS.includes(process.env.METAMASK_ENVIRONMENT)) {
    // Sample 1% of users in production-like environments.
    return 0.01;
  }

  return 1;
}
