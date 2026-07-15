/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE } from '../../../../shared/lib/transaction/enforced-simulations';
import {
  selectEnforcedSimulationsSlippage,
  selectIsEnforcedSimulationsEnabled,
  selectIsMetaMaskPayDappsEnabled,
  selectIsPayAmountPrefillEnabled,
  selectIsPayHardwareEnabled,
  selectPayQuoteConfig,
  selectPreferredPayToken,
} from './feature-flags';

type ConfirmationsPayDappsFlag = {
  enabled?: boolean;
};

type EnforcedSimulationsFlag = {
  enabled?: boolean;
  slippage?: number;
};

type PayPostQuoteConfig = {
  enabled?: boolean;
  tokens?: Record<string, string[]>;
};

type PayPostQuoteFlag = {
  default?: PayPostQuoteConfig;
  overrides?: Record<string, PayPostQuoteConfig>;
  perpsWithdraw?: PayPostQuoteConfig;
};

type PreferredPayToken = {
  address?: string;
  chainId?: string;
  name?: string;
};

type PreferredTokensConfig = {
  default?: PreferredPayToken[] | Record<string, PreferredPayToken[]>;
  overrides?: Record<string, PreferredPayToken[]>;
  perpsWithdraw?: PreferredPayToken[];
};

type PayTokensFlag = {
  preferredTokens?: PreferredTokensConfig;
};

type PayPrefilledAmountConfig = {
  enabled?: boolean;
};

type PayExtendedFlag = {
  prefilledAmount?: {
    default?: PayPrefilledAmountConfig;
    overrides?: Record<string, PayPrefilledAmountConfig>;
    musdConversion?: PayPrefilledAmountConfig;
  };
};

type HardwareWalletFlag = {
  enabled?: boolean;
};

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      confirmations_pay_dapps?: ConfirmationsPayDappsFlag;
      confirmations_enforced_simulations?: EnforcedSimulationsFlag;
      confirmations_pay_post_quote?: PayPostQuoteFlag;
      confirmations_pay_tokens?: PayTokensFlag;
      confirmations_pay_extended?: PayExtendedFlag;
      confirmations_pay_hardware?: HardwareWalletFlag;
    };
  };
};

const getMockState = (
  confirmations_pay_dapps?: ConfirmationsPayDappsFlag,
): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      ...(confirmations_pay_dapps !== undefined && {
        confirmations_pay_dapps,
      }),
    },
  },
});

const getMockEnforcedSimulationsState = (
  confirmations_enforced_simulations?: EnforcedSimulationsFlag,
): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      ...(confirmations_enforced_simulations !== undefined && {
        confirmations_enforced_simulations,
      }),
    },
  },
});

const getMockPayPostQuoteState = (
  confirmations_pay_post_quote?: PayPostQuoteFlag,
): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      ...(confirmations_pay_post_quote !== undefined && {
        confirmations_pay_post_quote,
      }),
    },
  },
});

const getMockPayTokensState = (
  confirmations_pay_tokens?: PayTokensFlag,
): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      ...(confirmations_pay_tokens !== undefined && {
        confirmations_pay_tokens,
      }),
    },
  },
});

const getMockPayExtendedState = (
  confirmations_pay_extended?: PayExtendedFlag,
): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      ...(confirmations_pay_extended !== undefined && {
        confirmations_pay_extended,
      }),
    },
  },
});

describe('Confirmations Pay Feature Flags', () => {
  describe('selectIsMetaMaskPayDappsEnabled', () => {
    it('returns true when enabled is true', () => {
      const state = getMockState({ enabled: true });
      expect(selectIsMetaMaskPayDappsEnabled(state)).toBe(true);
    });

    it('returns false when enabled is false', () => {
      const state = getMockState({ enabled: false });
      expect(selectIsMetaMaskPayDappsEnabled(state)).toBe(false);
    });

    it('defaults to false when confirmations_pay_dapps is not set', () => {
      const state = getMockState();
      expect(selectIsMetaMaskPayDappsEnabled(state)).toBe(false);
    });

    it('defaults to false when confirmations_pay_dapps is an empty object', () => {
      const state = getMockState({});
      expect(selectIsMetaMaskPayDappsEnabled(state)).toBe(false);
    });

    it('defaults to false when remoteFeatureFlags is empty', () => {
      const state: MockState = {
        metamask: {
          remoteFeatureFlags: {},
        },
      };
      expect(selectIsMetaMaskPayDappsEnabled(state)).toBe(false);
    });
  });

  describe('selectPayQuoteConfig', () => {
    it('returns the default post-quote config when no transaction override is set', () => {
      const state = getMockPayPostQuoteState({
        default: {
          enabled: true,
          tokens: {
            '0xa4b1': ['0xaf88d065e77c8cc2239327c5edb3a432268e5831'],
          },
        },
      });

      expect(selectPayQuoteConfig(state, 'perpsWithdraw')).toStrictEqual({
        enabled: true,
        tokens: {
          '0xa4b1': ['0xaf88d065e77c8cc2239327c5edb3a432268e5831'],
        },
      });
    });

    it('merges mobile-compatible overrides with the default config', () => {
      const state = getMockPayPostQuoteState({
        default: {
          enabled: true,
          tokens: {
            '0xa4b1': ['0xaf88d065e77c8cc2239327c5edb3a432268e5831'],
          },
        },
        overrides: {
          perpsWithdraw: {
            tokens: {
              '0x38': ['0x55d398326f99059ff775485246999027b3197955'],
            },
          },
        },
      });

      expect(selectPayQuoteConfig(state, 'perpsWithdraw')).toStrictEqual({
        enabled: true,
        tokens: {
          '0x38': ['0x55d398326f99059ff775485246999027b3197955'],
        },
      });
    });

    it('supports direct transaction config at perpsWithdraw.tokens', () => {
      const state = getMockPayPostQuoteState({
        default: { enabled: false },
        perpsWithdraw: {
          enabled: true,
          tokens: {
            '0x38': ['0x55d398326f99059ff775485246999027b3197955'],
          },
        },
      });

      expect(selectPayQuoteConfig(state, 'perpsWithdraw')).toStrictEqual({
        enabled: true,
        tokens: {
          '0x38': ['0x55d398326f99059ff775485246999027b3197955'],
        },
      });
    });

    it('defaults to disabled when the post-quote flag is not set', () => {
      const state = getMockPayPostQuoteState();

      expect(selectPayQuoteConfig(state, 'perpsWithdraw')).toStrictEqual({
        enabled: false,
        tokens: undefined,
      });
    });
  });

  describe('selectPreferredPayToken', () => {
    it('returns the first transaction override token from the resolved config', () => {
      const state = getMockPayTokensState({
        preferredTokens: {
          default: {},
          overrides: {
            perpsWithdraw: [
              {
                address: '0x1111111111111111111111111111111111111111',
                chainId: '0x1',
                name: 'mUSD',
              },
              {
                address: '0x2222222222222222222222222222222222222222',
                chainId: '0xa4b1',
                name: 'USDC',
              },
            ],
          },
        },
      });

      expect(selectPreferredPayToken(state, 'perpsWithdraw')).toStrictEqual({
        address: '0x1111111111111111111111111111111111111111',
        chainId: '0x1',
        name: 'mUSD',
      });
    });

    it('supports direct transaction config', () => {
      const state = getMockPayTokensState({
        preferredTokens: {
          perpsWithdraw: [
            {
              address: '0x3333333333333333333333333333333333333333',
              chainId: '0x38',
            },
          ],
        },
      });

      expect(selectPreferredPayToken(state, 'perpsWithdraw')).toStrictEqual({
        address: '0x3333333333333333333333333333333333333333',
        chainId: '0x38',
      });
    });

    it('returns undefined when no preferred token is configured', () => {
      const state = getMockPayTokensState({
        preferredTokens: {
          default: {},
        },
      });

      expect(selectPreferredPayToken(state, 'perpsWithdraw')).toBeUndefined();
    });
  });

  describe('selectIsPayAmountPrefillEnabled', () => {
    it('returns true when the transaction override is enabled', () => {
      const state = getMockPayExtendedState({
        prefilledAmount: {
          default: { enabled: false },
          overrides: { musdConversion: { enabled: true } },
        },
      });

      expect(selectIsPayAmountPrefillEnabled(state, 'musdConversion')).toBe(
        true,
      );
    });

    it('supports direct transaction config', () => {
      const state = getMockPayExtendedState({
        prefilledAmount: {
          default: { enabled: false },
          musdConversion: { enabled: true },
        },
      });

      expect(selectIsPayAmountPrefillEnabled(state, 'musdConversion')).toBe(
        true,
      );
    });

    it('falls back to the default when no transaction override is set', () => {
      const state = getMockPayExtendedState({
        prefilledAmount: { default: { enabled: true } },
      });

      expect(selectIsPayAmountPrefillEnabled(state, 'musdConversion')).toBe(
        true,
      );
    });

    it('returns false when the default is disabled and no override matches', () => {
      const state = getMockPayExtendedState({
        prefilledAmount: {
          default: { enabled: false },
          overrides: { perpsWithdraw: { enabled: true } },
        },
      });

      expect(selectIsPayAmountPrefillEnabled(state, 'musdConversion')).toBe(
        false,
      );
    });

    it('defaults to false when the flag is not set', () => {
      const state = getMockPayExtendedState();

      expect(selectIsPayAmountPrefillEnabled(state, 'musdConversion')).toBe(
        false,
      );
    });

    it('defaults to false when prefilledAmount is empty', () => {
      const state = getMockPayExtendedState({ prefilledAmount: {} });

      expect(selectIsPayAmountPrefillEnabled(state, 'musdConversion')).toBe(
        false,
      );
    });
  });

  describe('selectIsPayHardwareEnabled', () => {
    const getMockPayHardwareState = (
      confirmations_pay_hardware?: HardwareWalletFlag,
    ): MockState => ({
      metamask: {
        remoteFeatureFlags: {
          ...(confirmations_pay_hardware !== undefined && {
            confirmations_pay_hardware,
          }),
        },
      },
    });

    it('returns true when enabled is true', () => {
      const state = getMockPayHardwareState({ enabled: true });
      expect(selectIsPayHardwareEnabled(state)).toBe(true);
    });

    it('returns false when enabled is false', () => {
      const state = getMockPayHardwareState({ enabled: false });
      expect(selectIsPayHardwareEnabled(state)).toBe(false);
    });

    it('defaults to false when confirmations_pay_hardware is not set', () => {
      const state = getMockPayHardwareState();
      expect(selectIsPayHardwareEnabled(state)).toBe(false);
    });

    it('defaults to false when confirmations_pay_hardware is an empty object', () => {
      const state = getMockPayHardwareState({});
      expect(selectIsPayHardwareEnabled(state)).toBe(false);
    });

    it('defaults to false when remoteFeatureFlags is empty', () => {
      const state: MockState = { metamask: { remoteFeatureFlags: {} } };
      expect(selectIsPayHardwareEnabled(state)).toBe(false);
    });
  });
});

describe('Confirmations Enforced Simulations Feature Flags', () => {
  describe('selectIsEnforcedSimulationsEnabled', () => {
    it('returns true when enabled is true', () => {
      const state = getMockEnforcedSimulationsState({ enabled: true });
      expect(selectIsEnforcedSimulationsEnabled(state)).toBe(true);
    });

    it('returns false when enabled is false', () => {
      const state = getMockEnforcedSimulationsState({ enabled: false });
      expect(selectIsEnforcedSimulationsEnabled(state)).toBe(false);
    });

    it('defaults to false when the flag is not set', () => {
      const state = getMockEnforcedSimulationsState();
      expect(selectIsEnforcedSimulationsEnabled(state)).toBe(false);
    });

    it('defaults to false when the flag is an empty object', () => {
      const state = getMockEnforcedSimulationsState({});
      expect(selectIsEnforcedSimulationsEnabled(state)).toBe(false);
    });
  });

  describe('selectEnforcedSimulationsSlippage', () => {
    it('returns the slippage value from the flag', () => {
      const state = getMockEnforcedSimulationsState({ slippage: 25 });
      expect(selectEnforcedSimulationsSlippage(state)).toBe(25);
    });

    it('falls back to the default when slippage is not provided', () => {
      const state = getMockEnforcedSimulationsState({ enabled: true });
      expect(selectEnforcedSimulationsSlippage(state)).toBe(
        DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE,
      );
    });

    it('falls back to the default when the flag is not set', () => {
      const state = getMockEnforcedSimulationsState();
      expect(selectEnforcedSimulationsSlippage(state)).toBe(
        DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE,
      );
    });
  });
});
