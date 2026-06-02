import { ENVIRONMENT } from '../constants/build';
import {
  getIsPerpsIncludedInBuild,
  getIsPasskeyFeatureEnabled,
  getIsAssetsUnifiedStateIncludedInBuild,
  getIsNewHardwareWalletOnboardingEnabled,
  getIsSeedlessOnboardingFeatureEnabled,
  getIsTelegramLoginFeatureEnabled,
  isProduction,
  isGatorPermissionsRevocationFeatureEnabled,
} from './environment';

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

describe('getIsTelegramLoginFeatureEnabled', () => {
  let originalSeedlessOnboardingEnabled: string | undefined;
  let originalTelegramLoginEnabled: string | undefined;

  beforeAll(() => {
    originalSeedlessOnboardingEnabled = process.env.SEEDLESS_ONBOARDING_ENABLED;
    originalTelegramLoginEnabled = process.env.TELEGRAM_LOGIN_ENABLED;
  });

  afterAll(() => {
    process.env.SEEDLESS_ONBOARDING_ENABLED = originalSeedlessOnboardingEnabled;
    process.env.TELEGRAM_LOGIN_ENABLED = originalTelegramLoginEnabled;
  });

  it('returns true when both seedless onboarding and Telegram login are enabled', () => {
    process.env.SEEDLESS_ONBOARDING_ENABLED = 'true';
    process.env.TELEGRAM_LOGIN_ENABLED = 'true';

    expect(getIsTelegramLoginFeatureEnabled()).toBe(true);
  });

  it('returns false when Telegram login is enabled but seedless onboarding is disabled', () => {
    process.env.SEEDLESS_ONBOARDING_ENABLED = 'false';
    process.env.TELEGRAM_LOGIN_ENABLED = 'true';

    expect(getIsTelegramLoginFeatureEnabled()).toBe(false);
  });

  it('returns false when seedless onboarding is enabled but Telegram login is disabled', () => {
    process.env.SEEDLESS_ONBOARDING_ENABLED = 'true';
    process.env.TELEGRAM_LOGIN_ENABLED = 'false';

    expect(getIsTelegramLoginFeatureEnabled()).toBe(false);
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

describe('getIsAssetsUnifiedStateIncludedInBuild', () => {
  let originalValue: string | undefined;

  beforeAll(() => {
    originalValue = process.env.ASSETS_UNIFIED_STATE_ENABLED;
  });

  afterAll(() => {
    process.env.ASSETS_UNIFIED_STATE_ENABLED = originalValue;
  });

  it('returns true when ASSETS_UNIFIED_STATE_ENABLED is "true"', () => {
    process.env.ASSETS_UNIFIED_STATE_ENABLED = 'true';
    expect(getIsAssetsUnifiedStateIncludedInBuild()).toBe(true);
  });

  it('returns false when ASSETS_UNIFIED_STATE_ENABLED is "false"', () => {
    process.env.ASSETS_UNIFIED_STATE_ENABLED = 'false';
    expect(getIsAssetsUnifiedStateIncludedInBuild()).toBe(false);
  });

  it('returns false when ASSETS_UNIFIED_STATE_ENABLED is undefined', () => {
    delete process.env.ASSETS_UNIFIED_STATE_ENABLED;
    expect(getIsAssetsUnifiedStateIncludedInBuild()).toBe(false);
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
