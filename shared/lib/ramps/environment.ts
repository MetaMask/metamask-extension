import { RampsEnvironment } from '@metamask/ramps-controller';

/**
 * Determines the ramps API environment for the extension build.
 *
 * Lives in `shared` because the UI needs it too: the provider callback URL it
 * builds has to point at the same ramps environment the background talks to.
 *
 * Build system emits `METAMASK_ENVIRONMENT` values from
 * `shared/constants/build-environment.json` (e.g. `release-candidate`,
 * `pull-request`). Those must be mapped here — matching only shorthand values
 * like `rc` never fires for real CI builds.
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
    // Actual value emitted for release/* CI builds.
    case 'release-candidate':
    // PR CI builds: keep remote feature flags on `dev` (where `rampsEnabled`
    // is on) while pointing the ramps API + callback host at Production.
    case 'pull-request':
      return RampsEnvironment.Production;
    case 'development':
    case 'dev':
      return RampsEnvironment.Development;
    case 'test':
    case 'testing':
    // `staging` = main-branch dist builds; `other` = local `yarn dist`.
    case 'staging':
    case 'other':
    default:
      return RampsEnvironment.Staging;
  }
}
