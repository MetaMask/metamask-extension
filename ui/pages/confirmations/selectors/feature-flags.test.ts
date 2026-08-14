/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE } from '../../../../shared/lib/transaction/enforced-simulations';
import {
  selectBlockedPayTokens,
  selectDepositLimits,
  selectEnableMoneyAccountTransactions,
  selectEnforcedSimulationsSlippage,
  selectIsEnforcedSimulationsEnabled,
  selectIsMetaMaskPayDappsEnabled,
  selectIsMoneyAccountTransactionEnabled,
  selectIsPayAmountPrefillEnabled,
  selectIsPayHardwareEnabled,
  selectMinimumRequiredTokenBalance,
  selectPayQuoteConfig,
  selectPreferredPayToken,
  selectPreferredPayTokens,
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
  blockedTokens?: {
    default?: {
      chainIds?: string[];
      tokens?: { address: string; chainId: string }[];
    };
    overrides?: Record<
      string,
      { chainIds?: string[]; tokens?: { address: string; chainId: string }[] }
    >;
  };
  minimumRequiredTokenBalance?: number;
};

type PayPrefilledAmountConfig = {
  enabled?: boolean;
};

type PayFlag = {
  depositLimit?: Record<string, number>;
};

type PayExtendedFlag = {
  prefilledAmount?: {
    default?: PayPrefilledAmountConfig;
    overrides?: Record<string, PayPrefilledAmountConfig>;
    musdConversion?: PayPrefilledAmountConfig;
  };
  enableMoneyAccountTransactions?: Record<string, boolean>;
};

type HardwareWalletFlag = {
  enabled?: boolean;
};

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      confirmations_pay?: PayFlag;
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

const getMockPayState = (confirmations_pay?: PayFlag): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      ...(confirmations_pay !== undefined && {
        confirmations_pay,
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

  describe('selectPreferredPayTokens', () => {
    it('returns all transaction override tokens from the resolved config', () => {
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

      expect(selectPreferredPayTokens(state, 'perpsWithdraw')).toStrictEqual([
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
      ]);
    });

    it('returns an empty array when no preferred tokens are configured', () => {
      const state = getMockPayTokensState({
        preferredTokens: {
          default: {},
        },
      });

      expect(selectPreferredPayTokens(state, 'perpsWithdraw')).toStrictEqual(
        [],
      );
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

  describe('selectBlockedPayTokens', () => {
    it('returns empty blocklists when the flag is unset', () => {
      const state = getMockPayTokensState();

      expect(
        selectBlockedPayTokens(state, 'moneyAccountDeposit'),
      ).toStrictEqual({
        chainIds: [],
        tokens: [],
      });
    });

    it('returns the default blocklist when no transaction override exists', () => {
      const state = getMockPayTokensState({
        blockedTokens: {
          default: {
            chainIds: ['0xa4b1'],
            tokens: [
              {
                address: '0x1111111111111111111111111111111111111111',
                chainId: '0x1',
              },
            ],
          },
        },
      });

      expect(
        selectBlockedPayTokens(state, 'moneyAccountDeposit'),
      ).toStrictEqual({
        chainIds: ['0xa4b1'],
        tokens: [
          {
            address: '0x1111111111111111111111111111111111111111',
            chainId: '0x1',
          },
        ],
      });
    });

    it('prefers a transaction-type override over the default blocklist', () => {
      const state = getMockPayTokensState({
        blockedTokens: {
          default: {
            chainIds: ['0xa4b1'],
            tokens: [],
          },
          overrides: {
            moneyAccountDeposit: {
              chainIds: [],
              tokens: [
                {
                  address: '0x2222222222222222222222222222222222222222',
                  chainId: '0x1',
                },
              ],
            },
          },
        },
      });

      expect(
        selectBlockedPayTokens(state, 'moneyAccountDeposit'),
      ).toStrictEqual({
        chainIds: [],
        tokens: [
          {
            address: '0x2222222222222222222222222222222222222222',
            chainId: '0x1',
          },
        ],
      });
    });
  });

  describe('selectMinimumRequiredTokenBalance', () => {
    it('defaults to 0 when the flag is unset', () => {
      const state = getMockPayTokensState();

      expect(selectMinimumRequiredTokenBalance(state)).toBe(0);
    });

    it('returns the configured minimum required token balance', () => {
      const state = getMockPayTokensState({
        minimumRequiredTokenBalance: 0.01,
      });

      expect(selectMinimumRequiredTokenBalance(state)).toBe(0.01);
    });
  });

  describe('selectDepositLimits', () => {
    it('returns the default empty map when the flag is absent', () => {
      const state = getMockPayState();

      expect(selectDepositLimits(state)).toStrictEqual({});
    });

    it('returns the default empty map when depositLimit is absent', () => {
      const state = getMockPayState({});

      expect(selectDepositLimits(state)).toStrictEqual({});
    });

    it('returns deposit limits from the feature flag', () => {
      const state = getMockPayState({
        depositLimit: {
          moneyAccountDeposit: 100000,
        },
      });

      expect(selectDepositLimits(state)).toStrictEqual({
        moneyAccountDeposit: 100000,
      });
    });

    it('returns multiple deposit type limits', () => {
      const state = getMockPayState({
        depositLimit: {
          moneyAccountDeposit: 100000,
          perpsDeposit: 25000,
        },
      });

      expect(selectDepositLimits(state)).toStrictEqual({
        moneyAccountDeposit: 100000,
        perpsDeposit: 25000,
      });
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

  describe('selectEnableMoneyAccountTransactions', () => {
    it('returns the map from the flag', () => {
      const state = getMockPayExtendedState({
        enableMoneyAccountTransactions: {
          perpsDeposit: true,
          predictDeposit: false,
        },
      });

      expect(selectEnableMoneyAccountTransactions(state)).toStrictEqual({
        perpsDeposit: true,
        predictDeposit: false,
      });
    });

    it('defaults to an empty map when the flag is absent', () => {
      const state = getMockPayExtendedState();
      expect(selectEnableMoneyAccountTransactions(state)).toStrictEqual({});
    });
  });

  describe('selectIsMoneyAccountTransactionEnabled', () => {
    it('returns true when the transaction type is enabled', () => {
      const state = getMockPayExtendedState({
        enableMoneyAccountTransactions: { perpsDeposit: true },
      });

      expect(
        selectIsMoneyAccountTransactionEnabled(state, 'perpsDeposit'),
      ).toBe(true);
    });

    it('returns false when the transaction type is disabled', () => {
      const state = getMockPayExtendedState({
        enableMoneyAccountTransactions: { perpsDeposit: false },
      });

      expect(
        selectIsMoneyAccountTransactionEnabled(state, 'perpsDeposit'),
      ).toBe(false);
    });

    it('returns false when the transaction type is absent', () => {
      const state = getMockPayExtendedState({
        enableMoneyAccountTransactions: { predictDeposit: true },
      });

      expect(
        selectIsMoneyAccountTransactionEnabled(state, 'perpsDeposit'),
      ).toBe(false);
    });

    it('returns false when the flag map is missing', () => {
      const state = getMockPayExtendedState();
      expect(
        selectIsMoneyAccountTransactionEnabled(state, 'perpsDeposit'),
      ).toBe(false);
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
