import { Env } from '@metamask/profile-sync-controller/sdk';

/**
 * Check if the FORCE_AUTH_MATCH_BUILD environment variable is set to `true`.
 *
 * @returns true if the FORCE_AUTH_MATCH_BUILD environment variable is set to `true`, false otherwise
 */
export function isForceAuthMatchBuild() {
  return process.env.FORCE_AUTH_MATCH_BUILD?.toString() === 'true';
}

export function loadAuthenticationConfig(): Env {
  // Local `yarn start` must mint DEV OIDC tokens. Staging on-ramp
  // (`on-ramp.uat-api`) accepts `iss: https://oidc.dev-api.cx.metamask.io`
  // and rejects PRD tokens on /v2/quotes and buy-widget (401).
  if (!isForceAuthMatchBuild()) {
    return Env.DEV;
  }

  const buildType = process.env.METAMASK_BUILD_TYPE;
  // use `Env.UAT` if build type is either `beta` or `uat`
  if (buildType === 'beta' || buildType === 'uat') {
    return Env.UAT;
  }
  return Env.PRD;
}
