import { Env } from '@metamask/profile-sync-controller/sdk';
import { getBooleanFlag } from '../../lib/common-utils';

/**
 * Check if the FORCE_AUTH_MATCH_BUILD environment variable is set to `true`.
 *
 * @returns true if the FORCE_AUTH_MATCH_BUILD environment variable is set to `true`, false otherwise
 */
export function isForceAuthMatchBuild() {
  return getBooleanFlag(process.env.FORCE_AUTH_MATCH_BUILD);
}

export function loadAuthenticationConfig(): Env {
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
