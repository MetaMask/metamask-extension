import { RampsEnvironment } from '@metamask/ramps-controller';

/**
 * Determines the ramps API environment for the extension build.
 *
 * Lives in `shared` because the UI needs it too: the provider callback URL it
 * builds has to point at the same ramps environment the background talks to.
 *
 * Build CI emits `METAMASK_ENVIRONMENT` from
 * `shared/constants/build-environment.json`. Release-branch dist builds use
 * `release-candidate` (not the shorthand `rc`), so that value must map to
 * Production or RC Chrome builds incorrectly talk to Staging.
 *
 * @returns The ramps environment for API requests.
 */
export function getRampsEnvironment(): RampsEnvironment {
  const metamaskEnvironment = process.env.METAMASK_ENVIRONMENT;
  switch (metamaskEnvironment) {
    case 'production':
    case 'beta':
    // Legacy / shorthand — kept for compatibility.
    case 'rc':
    // Actual value emitted for `release/*` CI builds (`yarn build dist`).
    case 'release-candidate':
      return RampsEnvironment.Production;
    case 'development':
    case 'dev':
      return RampsEnvironment.Development;
    case 'test':
    case 'testing':
    default:
      return RampsEnvironment.Staging;
  }
}
