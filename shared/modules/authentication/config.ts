import { Env } from '@metamask/profile-sync-controller/sdk';
import { ENVIRONMENT } from '../../../development/build/constants';

/**
 * Check if the force auth match build is enabled.
 *
 * @returns true if the force auth match build is enabled, false otherwise
 */
export function isForceAuthMatchBuild() {
  return process.env.FORCE_AUTH_MATCH_BUILD?.toString() === 'true';
}

export function isDevEnvironment() {
  return process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT;
}

export function loadAuthenticationConfig(): Env {
  if (!isForceAuthMatchBuild()) {
    return Env.PRD;
  }

  const buildType = process.env.METAMASK_BUILD_TYPE;
  // `uat` build type for uat environment only build
  if (buildType === 'beta' || buildType === 'uat') {
    return Env.UAT;
  }
  return Env.PRD;
}
