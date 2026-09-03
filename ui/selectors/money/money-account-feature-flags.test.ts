import type { Json } from '@metamask/utils';
import type { RemoteFeatureFlagsState } from '../../../shared/lib/selectors/remote-feature-flags';
import {
  FALLBACK_MONEY_DEPOSIT_MIN_BALANCE,
  selectMoneyAccountDepositQuotePipelineEnabled,
  selectMoneyAccountFeatureEnabled,
  selectMoneyAccountVaultConfig,
  selectMoneyActivityDetailsEnabled,
  selectMoneyActivityMockDataEnabled,
  selectMoneyEarningSectionEnabled,
  selectMoneyDepositMinBalance,
  selectMoneyVaultApyRemoteConfig,
} from './money-account-feature-flags';

const mockState = (
  remoteFeatureFlags: Record<string, Json> = {},
): RemoteFeatureFlagsState => ({ metamask: { remoteFeatureFlags } });

/**
 * A well-formed config. Every address is a valid ERC-55 checksum.
 */
const VALID_CONFIG = {
  chainId: '0x8f',
  boringVault: '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae',
  tellerAddress: '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117',
  accountantAddress: '0x7382c5b8B51B8C4f127B3123C1039581BAA5A06B',
  lensAddress: '0xA816ECd922de94c6879AD23B9A884dB257F20947',
  underlyingToken: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
} as const;

describe('selectMoneyAccountFeatureEnabled', () => {
  it('is true for an enabled, version-satisfied flag', () => {
    expect(
      selectMoneyAccountFeatureEnabled(
        mockState({
          moneyEnableMoneyAccount: { enabled: true, minimumVersion: '0.0.1' },
        }),
      ),
    ).toBe(true);
  });

  it('is false for a disabled flag', () => {
    expect(
      selectMoneyAccountFeatureEnabled(
        mockState({
          moneyEnableMoneyAccount: { enabled: false, minimumVersion: '0.0.1' },
        }),
      ),
    ).toBe(false);
  });

  it('is false when the flag is unserved', () => {
    expect(selectMoneyAccountFeatureEnabled(mockState())).toBe(false);
  });

  it('is false when the current version is below the flag minimum', () => {
    expect(
      selectMoneyAccountFeatureEnabled(
        mockState({
          moneyEnableMoneyAccount: {
            enabled: true,
            minimumVersion: '9999.0.0',
          },
        }),
      ),
    ).toBe(false);
  });
});

describe('selectMoneyEarningSectionEnabled', () => {
  it('is true for an enabled, version-satisfied flag', () => {
    expect(
      selectMoneyEarningSectionEnabled(
        mockState({
          earnMoneyEarningSectionEnabled: {
            enabled: true,
            minimumVersion: '0.0.1',
          },
        }),
      ),
    ).toBe(true);
  });

  it('is false for a disabled flag', () => {
    expect(
      selectMoneyEarningSectionEnabled(
        mockState({
          earnMoneyEarningSectionEnabled: {
            enabled: false,
            minimumVersion: '0.0.1',
          },
        }),
      ),
    ).toBe(false);
  });

  it('is false when the flag is unserved or malformed', () => {
    expect(selectMoneyEarningSectionEnabled(mockState())).toBe(false);
    expect(
      selectMoneyEarningSectionEnabled(
        mockState({ earnMoneyEarningSectionEnabled: true }),
      ),
    ).toBe(false);
  });

  it('is false when the current version is below the flag minimum', () => {
    expect(
      selectMoneyEarningSectionEnabled(
        mockState({
          earnMoneyEarningSectionEnabled: {
            enabled: true,
            minimumVersion: '9999.0.0',
          },
        }),
      ),
    ).toBe(false);
  });
});

describe('selectMoneyAccountVaultConfig', () => {
  it('returns the parsed config from the flag', () => {
    expect(
      selectMoneyAccountVaultConfig(
        mockState({ moneyAccountVaultConfig: { ...VALID_CONFIG } }),
      ),
    ).toStrictEqual(VALID_CONFIG);
  });

  it('returns undefined when the flag is unserved', () => {
    expect(selectMoneyAccountVaultConfig(mockState())).toBeUndefined();
  });

  it('returns undefined when the flag is malformed', () => {
    expect(
      selectMoneyAccountVaultConfig(
        mockState({
          moneyAccountVaultConfig: { ...VALID_CONFIG, lensAddress: '0x0' },
        }),
      ),
    ).toBeUndefined();
  });
});

describe('selectMoneyVaultApyRemoteConfig', () => {
  it('reads the fallback and override', () => {
    expect(
      selectMoneyVaultApyRemoteConfig(
        mockState({
          earnMoneyVaultApyControl: {
            vaultApyFallback: 0.04,
            vaultApyOverride: 0.08,
          },
        }),
      ),
    ).toStrictEqual({ vaultApyFallback: 0.04, vaultApyOverride: 0.08 });
  });

  it('accepts numeric strings', () => {
    expect(
      selectMoneyVaultApyRemoteConfig(
        mockState({
          earnMoneyVaultApyControl: {
            vaultApyFallback: '0.04',
            vaultApyOverride: '0',
          },
        }),
      ),
    ).toStrictEqual({ vaultApyFallback: 0.04, vaultApyOverride: 0 });
  });

  const UNCONFIGURED_APY_FLAGS: [string, Record<string, Json>][] = [
    ['the flag is unserved', {}],
    ['the flag is not an object', { earnMoneyVaultApyControl: 'on' }],
    [
      'the values are negative',
      { earnMoneyVaultApyControl: { vaultApyFallback: -1 } },
    ],
    [
      'the values are not numeric',
      { earnMoneyVaultApyControl: { vaultApyFallback: 'soon' } },
    ],
  ];

  for (const [description, flags] of UNCONFIGURED_APY_FLAGS) {
    it(`returns undefined values when ${description}`, () => {
      expect(selectMoneyVaultApyRemoteConfig(mockState(flags))).toStrictEqual({
        vaultApyFallback: undefined,
        vaultApyOverride: undefined,
      });
    });
  }
});

describe('selectMoneyDepositMinBalance', () => {
  it('reads a numeric remote value', () => {
    expect(
      selectMoneyDepositMinBalance(
        mockState({ earnMoneyDepositMinAssetBalance: 5 }),
      ),
    ).toBe(5);
  });

  it('accepts a numeric string', () => {
    expect(
      selectMoneyDepositMinBalance(
        mockState({ earnMoneyDepositMinAssetBalance: '1.25' }),
      ),
    ).toBe(1.25);
  });

  const INVALID_MIN_BALANCES: [string, Json | undefined][] = [
    ['an unserved value', undefined],
    ['a negative value', -1],
    ['a non-numeric value', 'invalid'],
  ];

  for (const [description, remoteValue] of INVALID_MIN_BALANCES) {
    it(`uses the fallback for ${description}`, () => {
      expect(
        selectMoneyDepositMinBalance(
          mockState({
            earnMoneyDepositMinAssetBalance: remoteValue as Json,
          }),
        ),
      ).toBe(FALLBACK_MONEY_DEPOSIT_MIN_BALANCE);
    });
  }
});

describe('selectMoneyAccountDepositQuotePipelineEnabled', () => {
  it('defaults to false', () => {
    expect(selectMoneyAccountDepositQuotePipelineEnabled(mockState())).toBe(
      false,
    );
  });

  it('reads a boolean flag', () => {
    expect(
      selectMoneyAccountDepositQuotePipelineEnabled(
        mockState({ moneyAccountDepositQuotePipeline: true }),
      ),
    ).toBe(true);
  });

  it('reads a version-gated flag', () => {
    expect(
      selectMoneyAccountDepositQuotePipelineEnabled(
        mockState({
          moneyAccountDepositQuotePipeline: {
            enabled: true,
            minimumVersion: '0.0.0',
          },
        }),
      ),
    ).toBe(true);
  });

  it('is false when the minimum version is not met', () => {
    expect(
      selectMoneyAccountDepositQuotePipelineEnabled(
        mockState({
          moneyAccountDepositQuotePipeline: {
            enabled: true,
            minimumVersion: '9999.0.0',
          },
        }),
      ),
    ).toBe(false);
  });
});

describe('selectMoneyActivityMockDataEnabled', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED;
    delete process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED;
    } else {
      process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED = originalEnv;
    }
  });

  it('is true when the remote flag is true', () => {
    expect(
      selectMoneyActivityMockDataEnabled(
        mockState({ moneyActivityMockDataEnabled: true }),
      ),
    ).toBe(true);
  });

  it('is false when the remote flag is false', () => {
    process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED = 'true';
    expect(
      selectMoneyActivityMockDataEnabled(
        mockState({ moneyActivityMockDataEnabled: false }),
      ),
    ).toBe(false);
  });

  it('falls back to the env var when the flag is unserved', () => {
    process.env.MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED = 'true';
    expect(selectMoneyActivityMockDataEnabled(mockState())).toBe(true);
  });

  it('is false when the flag is unserved and the env var is off', () => {
    expect(selectMoneyActivityMockDataEnabled(mockState())).toBe(false);
  });
});

describe('selectMoneyActivityDetailsEnabled', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS;
    delete process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS;
    } else {
      process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS = originalEnv;
    }
  });

  it('is true when the remote flag is true', () => {
    expect(
      selectMoneyActivityDetailsEnabled(
        mockState({ moneyEnableActivityDetails: true }),
      ),
    ).toBe(true);
  });

  it('is false when the remote flag is false', () => {
    process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS = 'true';
    expect(
      selectMoneyActivityDetailsEnabled(
        mockState({ moneyEnableActivityDetails: false }),
      ),
    ).toBe(false);
  });

  it('falls back to the env var when the flag is unserved', () => {
    process.env.MM_MONEY_ENABLE_ACTIVITY_DETAILS = 'true';
    expect(selectMoneyActivityDetailsEnabled(mockState())).toBe(true);
  });

  it('is false when the flag is unserved and the env var is off', () => {
    expect(selectMoneyActivityDetailsEnabled(mockState())).toBe(false);
  });
});
