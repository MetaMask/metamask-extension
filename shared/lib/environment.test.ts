import { ENVIRONMENT } from '../constants/build';
import {
  getIsPerpsIncludedInBuild,
  getIsPasskeyFeatureEnabled,
  getIsNewHardwareWalletOnboardingEnabled,
  getIsSeedlessOnboardingFeatureEnabled,
  getIsBasicFunctionalityConsolidationEnabledInBuild,
  isInE2eTest,
  isProduction,
  isGatorPermissionsRevocationFeatureEnabled,
} from './environment';

describe('isInE2eTest', () => {
  let originalInTest: string | undefined;
  let originalJestWorkerId: string | undefined;

  beforeAll(() => {
    originalInTest = process.env.IN_TEST;
    originalJestWorkerId = process.env.JEST_WORKER_ID;
  });

  afterAll(() => {
    if (originalInTest === undefined) {
      delete process.env.IN_TEST;
    } else {
      process.env.IN_TEST = originalInTest;
    }

    if (originalJestWorkerId === undefined) {
      delete process.env.JEST_WORKER_ID;
    } else {
      process.env.JEST_WORKER_ID = originalJestWorkerId;
    }
  });

  (
    [
      ['test extension build', 'undefined', true],
      ['test build without a worker ID', undefined, false],
      ['Jest worker', '1', false],
    ] as const
  ).forEach(([_description, jestWorkerId, expected]) => {
    it(`returns ${expected} for ${_description}`, () => {
      process.env.IN_TEST = 'true';
      if (jestWorkerId === undefined) {
        delete process.env.JEST_WORKER_ID;
      } else {
        process.env.JEST_WORKER_ID = jestWorkerId;
      }

      expect(isInE2eTest()).toBe(expected);
    });
  });

  it('returns false outside a test build', () => {
    delete process.env.IN_TEST;
    process.env.JEST_WORKER_ID = 'undefined';

    expect(isInE2eTest()).toBe(false);
  });
});

describe('isProduction', () => {
  let originalMetaMaskEnvironment: string | undefined;

  beforeAll(() => {
    originalMetaMaskEnvironment = process.env.METAMASK_ENVIRONMENT;
  });

  afterAll(() => {
    process.env.METAMASK_ENVIRONMENT = originalMetaMaskEnvironment;
  });

  it('should return true when ENVIRONMENT is "production"', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
    expect(isProduction()).toBe(true);
  });

  it('should return false when ENVIRONMENT is "development"', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;
    expect(isProduction()).toBe(false);
  });

  it('should return false when ENVIRONMENT is "testing"', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
    expect(isProduction()).toBe(false);
  });
});

describe('getIsSeedlessOnboardingFeatureEnabled', () => {
  let originalValue: string | undefined;

  beforeAll(() => {
    originalValue = process.env.SEEDLESS_ONBOARDING_ENABLED;
  });

  afterAll(() => {
    process.env.SEEDLESS_ONBOARDING_ENABLED = originalValue;
  });

  it('returns true when SEEDLESS_ONBOARDING_ENABLED is "true"', () => {
    process.env.SEEDLESS_ONBOARDING_ENABLED = 'true';
    expect(getIsSeedlessOnboardingFeatureEnabled()).toBe(true);
  });

  it('returns false when SEEDLESS_ONBOARDING_ENABLED is "false"', () => {
    process.env.SEEDLESS_ONBOARDING_ENABLED = 'false';
    expect(getIsSeedlessOnboardingFeatureEnabled()).toBe(false);
  });

  it('returns false when SEEDLESS_ONBOARDING_ENABLED is undefined', () => {
    delete process.env.SEEDLESS_ONBOARDING_ENABLED;
    expect(getIsSeedlessOnboardingFeatureEnabled()).toBe(false);
  });
});

describe('isGatorPermissionsRevocationFeatureEnabled', () => {
  it('should return true when GATOR_PERMISSIONS_REVOCATION_ENABLED is "true"', () => {
    process.env.GATOR_PERMISSIONS_REVOCATION_ENABLED = 'true';
    expect(isGatorPermissionsRevocationFeatureEnabled()).toBe(true);
  });

  it('should return false when GATOR_PERMISSIONS_REVOCATION_ENABLED is "false"', () => {
    process.env.GATOR_PERMISSIONS_REVOCATION_ENABLED = 'false';
    expect(isGatorPermissionsRevocationFeatureEnabled()).toBe(false);
  });

  it('should return false when GATOR_PERMISSIONS_REVOCATION_ENABLED is undefined', () => {
    delete process.env.GATOR_PERMISSIONS_REVOCATION_ENABLED;
    expect(isGatorPermissionsRevocationFeatureEnabled()).toBe(false);
  });
});

describe('getIsBasicFunctionalityConsolidationEnabledInBuild', () => {
  let originalValue: string | undefined;

  beforeAll(() => {
    originalValue = process.env.BFT_CONSOLIDATION_ENABLED;
  });

  afterAll(() => {
    process.env.BFT_CONSOLIDATION_ENABLED = originalValue;
  });

  it('returns true when BFT_CONSOLIDATION_ENABLED is "true"', () => {
    process.env.BFT_CONSOLIDATION_ENABLED = 'true';
    expect(getIsBasicFunctionalityConsolidationEnabledInBuild()).toBe(true);
  });

  it('returns false when BFT_CONSOLIDATION_ENABLED is "false"', () => {
    process.env.BFT_CONSOLIDATION_ENABLED = 'false';
    expect(getIsBasicFunctionalityConsolidationEnabledInBuild()).toBe(false);
  });

  it('returns false when BFT_CONSOLIDATION_ENABLED is undefined', () => {
    delete process.env.BFT_CONSOLIDATION_ENABLED;
    expect(getIsBasicFunctionalityConsolidationEnabledInBuild()).toBe(false);
  });
});

describe('getIsPerpsIncludedInBuild', () => {
  let originalPerpsEnabled: string | undefined;

  beforeAll(() => {
    originalPerpsEnabled = process.env.PERPS_ENABLED;
  });

  afterAll(() => {
    process.env.PERPS_ENABLED = originalPerpsEnabled;
  });

  it('returns true when PERPS_ENABLED is "true"', () => {
    process.env.PERPS_ENABLED = 'true';
    expect(getIsPerpsIncludedInBuild()).toBe(true);
  });

  it('returns false when PERPS_ENABLED is "false"', () => {
    process.env.PERPS_ENABLED = 'false';
    expect(getIsPerpsIncludedInBuild()).toBe(false);
  });

  it('returns false when PERPS_ENABLED is undefined', () => {
    delete process.env.PERPS_ENABLED;
    expect(getIsPerpsIncludedInBuild()).toBe(false);
  });
});

describe('getIsNewHardwareWalletOnboardingEnabled', () => {
  let originalValue: string | undefined;

  beforeAll(() => {
    originalValue = process.env.NEW_HARDWARE_WALLET_ONBOARDING;
  });

  afterAll(() => {
    process.env.NEW_HARDWARE_WALLET_ONBOARDING = originalValue;
  });

  it('returns true when NEW_HARDWARE_WALLET_ONBOARDING is "true"', () => {
    process.env.NEW_HARDWARE_WALLET_ONBOARDING = 'true';
    expect(getIsNewHardwareWalletOnboardingEnabled()).toBe(true);
  });

  it('returns false when NEW_HARDWARE_WALLET_ONBOARDING is "false"', () => {
    process.env.NEW_HARDWARE_WALLET_ONBOARDING = 'false';
    expect(getIsNewHardwareWalletOnboardingEnabled()).toBe(false);
  });

  it('returns false when NEW_HARDWARE_WALLET_ONBOARDING is undefined', () => {
    delete process.env.NEW_HARDWARE_WALLET_ONBOARDING;
    expect(getIsNewHardwareWalletOnboardingEnabled()).toBe(false);
  });
});

describe('getIsPasskeyFeatureEnabled', () => {
  let originalValue: string | undefined;

  beforeAll(() => {
    originalValue = process.env.PASSKEY_ENABLED;
  });

  afterAll(() => {
    process.env.PASSKEY_ENABLED = originalValue;
  });

  it('returns true when PASSKEY_ENABLED is "true"', () => {
    process.env.PASSKEY_ENABLED = 'true';
    expect(getIsPasskeyFeatureEnabled()).toBe(true);
  });

  it('returns false when PASSKEY_ENABLED is "false"', () => {
    process.env.PASSKEY_ENABLED = 'false';
    expect(getIsPasskeyFeatureEnabled()).toBe(false);
  });

  it('returns false when PASSKEY_ENABLED is undefined', () => {
    delete process.env.PASSKEY_ENABLED;
    expect(getIsPasskeyFeatureEnabled()).toBe(false);
  });
});
