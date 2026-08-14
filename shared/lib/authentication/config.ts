import { Env } from '@metamask/profile-sync-controller/sdk';
import { ENVIRONMENT } from '../../constants/build';

/**
 * Check if the FORCE_AUTH_MATCH_BUILD environment variable is set to `true`.
 *
 * @returns true if FORCE_AUTH_MATCH_BUILD is `true`, false otherwise
 */
export function isForceAuthMatchBuild() {
  return process.env.FORCE_AUTH_MATCH_BUILD?.toString() === 'true';
}

export function loadAuthenticationConfig(): Env {
  // Local webpack (`yarn start`) uses DEV Profile Sync for staging on-ramp.
  // Keep `testing`/E2E on PRD so mocks at authentication.api.cx.metamask.io match.
  if (process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT) {
    return Env.DEV;
  }

  if (!isForceAuthMatchBuild()) {
    return Env.PRD;
  }

  const buildType = process.env.METAMASK_BUILD_TYPE;
  if (buildType === 'beta' || buildType === 'uat') {
    return Env.UAT;
  }
  return Env.PRD;
}
