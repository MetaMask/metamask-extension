import type { Json } from '@metamask/utils';
import type { RemoteFeatureFlagsState } from '../../../shared/lib/selectors/remote-feature-flags';
import {
  selectMoneyAccountDepositQuotePipelineEnabled,
  selectMoneyAccountFeatureEnabled,
  selectMoneyAccountVaultConfig,
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
