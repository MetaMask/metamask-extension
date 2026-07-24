import { Web3AuthNetwork } from '@metamask/seedless-onboarding-controller';
import { ENVIRONMENT } from '../../../../shared/constants/build';
import { getSeedlessOnboardingControllerInstanceOptions } from './seedless-onboarding-controller';

describe('getSeedlessOnboardingControllerInstanceOptions', () => {
  const initMessenger = {
    call: jest.fn(),
  };

  beforeAll(() => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns devnet network and OAuth callbacks in testing builds', () => {
    const options = getSeedlessOnboardingControllerInstanceOptions({
      initMessenger: initMessenger as never,
    });

    expect(options.network).toBe(Web3AuthNetwork.Devnet);
    expect(options.passwordOutdatedCacheTTL).toBe(15_000);
    expect(options.encryptor).toEqual(
      expect.objectContaining({
        decrypt: expect.any(Function),
        encrypt: expect.any(Function),
      }),
    );
    expect(options.refreshJWTToken).toEqual(expect.any(Function));
    expect(options.revokeRefreshToken).toEqual(expect.any(Function));
    expect(options.renewRefreshToken).toEqual(expect.any(Function));
  });
});
