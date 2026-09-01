import { RampsEnvironment } from '@metamask/ramps-controller';
import {
  ENVIRONMENT,
  type MetaMaskBuildEnvironment,
} from '../../constants/build';

/**
 * Determines the ramps API environment for the extension build.
 *
 * Lives in `shared` because the UI needs it too: the provider callback URL it
 * builds has to point at the same ramps environment the background talks to.
 *
 * @returns The ramps environment for API requests.
 */
export function getRampsEnvironment(): RampsEnvironment {
  const metamaskEnvironment = process.env
    .METAMASK_ENVIRONMENT as MetaMaskBuildEnvironment;
  switch (metamaskEnvironment) {
    case ENVIRONMENT.PRODUCTION:
    case ENVIRONMENT.RELEASE_CANDIDATE:
      return RampsEnvironment.Production;
    case ENVIRONMENT.STAGING:
      // MetaMask's staging environment is used for nightly builds from main,
      // which should use production Ramps. Experimental nightlies also use
      // MetaMask's staging environment, but must use Ramps staging/UAT.
      return process.env.METAMASK_BUILD_TYPE === 'experimental'
        ? RampsEnvironment.Staging
        : RampsEnvironment.Production;
    case ENVIRONMENT.DEVELOPMENT:
      return RampsEnvironment.Development;
    case ENVIRONMENT.OTHER:
    case ENVIRONMENT.PULL_REQUEST:
    case ENVIRONMENT.TESTING:
    default:
      return RampsEnvironment.Staging;
  }
}
