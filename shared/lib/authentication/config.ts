import { Env } from '@metamask/profile-sync-controller/sdk';
import { devApiEnv } from './dev-api-env';

/**
 * Check if the FORCE_AUTH_MATCH_BUILD environment variable is set to `true`.
 *
 * @returns true if FORCE_AUTH_MATCH_BUILD is `true`, false otherwise
 */
export function isForceAuthMatchBuild() {
  return process.env.FORCE_AUTH_MATCH_BUILD?.toString() === 'true';
}

/**
 * Profile Sync / identity `Env` for AuthenticationController and services
 * that share its JWT. Opt in to DEV with `MM_DEV_API_ENV=dev`; default is PRD.
 * `FORCE_AUTH_MATCH_BUILD` still maps beta/uat builds to UAT.
 *
 * @returns the authentication environment
 */
export function loadAuthenticationConfig(): Env {
  if (isForceAuthMatchBuild()) {
    const buildType = process.env.METAMASK_BUILD_TYPE;
    if (buildType === 'beta' || buildType === 'uat') {
      return Env.UAT;
    }
    return Env.PRD;
  }

  return devApiEnv() === 'dev' ? Env.DEV : Env.PRD;
}
