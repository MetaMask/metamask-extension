import { RampsEnvironment } from '@metamask/ramps-controller';

/**
 * Determines the ramps API environment for the extension build.
 *
 * Lives in `shared` because the UI needs it too: the provider callback URL it
 * builds has to point at the same ramps environment the background talks to.
 *
 * @returns The ramps environment for API requests.
 */
export function getRampsEnvironment(): RampsEnvironment {
  const metamaskEnvironment = process.env.METAMASK_ENVIRONMENT;
  switch (metamaskEnvironment) {
    case 'production':
    case 'beta':
    case 'rc':
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
