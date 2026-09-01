import { RampsEnvironment } from '@metamask/ramps-controller';
import {
  ENVIRONMENT,
  type MetaMaskBuildEnvironment,
} from '../../constants/build';

import { getRampsEnvironment } from './environment';

const EXPECTED_RAMPS_ENVIRONMENT_BY_METAMASK_ENVIRONMENT: Record<
  MetaMaskBuildEnvironment,
  RampsEnvironment
> = {
  [ENVIRONMENT.DEVELOPMENT]: RampsEnvironment.Development,
  [ENVIRONMENT.OTHER]: RampsEnvironment.Staging,
  [ENVIRONMENT.PRODUCTION]: RampsEnvironment.Production,
  [ENVIRONMENT.PULL_REQUEST]: RampsEnvironment.Staging,
  [ENVIRONMENT.RELEASE_CANDIDATE]: RampsEnvironment.Production,
  [ENVIRONMENT.STAGING]: RampsEnvironment.Production,
  [ENVIRONMENT.TESTING]: RampsEnvironment.Staging,
};

const ENVIRONMENT_ALIASES = ['beta', 'dev', 'rc', 'test'];

describe('getRampsEnvironment', () => {
  const originalEnv = process.env.METAMASK_ENVIRONMENT;
  const originalBuildType = process.env.METAMASK_BUILD_TYPE;

  afterEach(() => {
    process.env.METAMASK_ENVIRONMENT = originalEnv;
    process.env.METAMASK_BUILD_TYPE = originalBuildType;
  });

  Object.entries(EXPECTED_RAMPS_ENVIRONMENT_BY_METAMASK_ENVIRONMENT).forEach(
    ([metamaskEnvironment, rampsEnvironment]) => {
      it(`maps METAMASK_ENVIRONMENT=${metamaskEnvironment} to ${rampsEnvironment} in main builds`, () => {
        process.env.METAMASK_ENVIRONMENT = metamaskEnvironment;
        process.env.METAMASK_BUILD_TYPE = 'main';

        expect(getRampsEnvironment()).toBe(rampsEnvironment);
      });
    },
  );

  it('returns Staging for experimental staging builds', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.STAGING;
    process.env.METAMASK_BUILD_TYPE = 'experimental';

    expect(getRampsEnvironment()).toBe(RampsEnvironment.Staging);
  });

  it('returns Staging when METAMASK_ENVIRONMENT is unset', () => {
    delete process.env.METAMASK_ENVIRONMENT;
    expect(getRampsEnvironment()).toBe(RampsEnvironment.Staging);
  });

  ENVIRONMENT_ALIASES.forEach((metamaskEnvironment) => {
    it(`returns Staging for remote-feature-flag environment alias "${metamaskEnvironment}"`, () => {
      process.env.METAMASK_ENVIRONMENT = metamaskEnvironment;

      expect(getRampsEnvironment()).toBe(RampsEnvironment.Staging);
    });
  });
});
