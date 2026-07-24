import { RampsEnvironment } from '@metamask/ramps-controller';

/**
 * Determines the ramps API environment for the extension build.
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
      return RampsEnvironment.Development;
    case 'dev':
    case 'test':
    default:
      return RampsEnvironment.Staging;
  }
}
