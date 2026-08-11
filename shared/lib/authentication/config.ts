import { Env } from '@metamask/profile-sync-controller/sdk';
import { ENVIRONMENT } from '../../constants/build';

/**
 * Check if the FORCE_AUTH_MATCH_BUILD environment variable is set to `true`.
 *
 * @returns true if the FORCE_AUTH_MATCH_BUILD environment variable is set to `true`, false otherwise
 */
export function isForceAuthMatchBuild() {
  return process.env.FORCE_AUTH_MATCH_BUILD?.toString() === 'true';
}

export function loadAuthenticationConfig(): Env {
  // Local webpack (`yarn start`) and test builds must use DEV Profile Sync to
  // match Portfolio localhost + staging on-ramp. Staging on-ramp
  // (`on-ramp.uat-api`) accepts `iss: https://oidc.dev-api.cx.metamask.io`
  // and rejects PRD tokens on /v2/quotes and buy-widget (401).
  if (
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT ||
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.TESTING
  ) {
    return Env.DEV;
  }

  if (!isForceAuthMatchBuild()) {
    return Env.PRD;
  }

  const buildType = process.env.METAMASK_BUILD_TYPE;
  // use `Env.UAT` if build type is either `beta` or `uat`
  if (buildType === 'beta' || buildType === 'uat') {
    return Env.UAT;
  }
  return Env.PRD;
}
