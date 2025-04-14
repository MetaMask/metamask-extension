import { ENVIRONMENT } from '../../development/build/constants';
import { isProduction } from './environment';

describe('isProduction', () => {
  let originalMetaMaskEnvironment: string | undefined;

  beforeAll(() => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    originalMetaMaskEnvironment = process.env.METAMASK_ENVIRONMENT;
  });

  afterAll(() => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    process.env.METAMASK_ENVIRONMENT = originalMetaMaskEnvironment;
  });

  it('should return true when ENVIRONMENT is "production"', () => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
    expect(isProduction()).toBe(true);
  });

  it('should return false when ENVIRONMENT is "development"', () => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;
    expect(isProduction()).toBe(false);
  });

  it('should return false when ENVIRONMENT is "testing"', () => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
    expect(isProduction()).toBe(false);
  });
});
