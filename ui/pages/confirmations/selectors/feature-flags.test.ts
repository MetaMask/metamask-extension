/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import {
  PayPostQuoteFlags,
  selectIsMetaMaskPayDappsEnabled,
  selectPayPostQuoteConfig,
} from './feature-flags';

type ConfirmationsPayDappsFlag = {
  enabled?: boolean;
};

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      confirmations_pay_dapps?: ConfirmationsPayDappsFlag;
      confirmations_pay_post_quote?: PayPostQuoteFlags;
    };
  };
};

const getMockState = ({
  confirmations_pay_dapps,
  confirmations_pay_post_quote,
}: {
  confirmations_pay_dapps?: ConfirmationsPayDappsFlag;
  confirmations_pay_post_quote?: PayPostQuoteFlags;
} = {}): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      ...(confirmations_pay_dapps !== undefined && {
        confirmations_pay_dapps,
      }),
      ...(confirmations_pay_post_quote !== undefined && {
        confirmations_pay_post_quote,
      }),
    },
  },
});

describe('Confirmations Pay Feature Flags', () => {
  describe('selectIsMetaMaskPayDappsEnabled', () => {
    it('returns true when enabled is true', () => {
      const state = getMockState({
        confirmations_pay_dapps: { enabled: true },
      });
      expect(selectIsMetaMaskPayDappsEnabled(state)).toBe(true);
    });

    it('returns false when enabled is false', () => {
      const state = getMockState({
        confirmations_pay_dapps: { enabled: false },
      });
      expect(selectIsMetaMaskPayDappsEnabled(state)).toBe(false);
    });

    it('defaults to false when confirmations_pay_dapps is not set', () => {
      const state = getMockState();
      expect(selectIsMetaMaskPayDappsEnabled(state)).toBe(false);
    });

    it('defaults to false when confirmations_pay_dapps is an empty object', () => {
      const state = getMockState({ confirmations_pay_dapps: {} });
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

  describe('selectPayPostQuoteConfig', () => {
    it('defaults to disabled when confirmations_pay_post_quote is not set', () => {
      const state = getMockState();

      expect(selectPayPostQuoteConfig(state, 'perpsWithdraw')).toStrictEqual({
        enabled: false,
        tokens: undefined,
      });
    });

    it('returns the default post-quote config when no transaction override exists', () => {
      const state = getMockState({
        confirmations_pay_post_quote: {
          default: {
            enabled: true,
            tokens: {
              eip155: ['eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831'],
            },
          },
        },
      });

      expect(selectPayPostQuoteConfig(state, 'perpsWithdraw')).toStrictEqual({
        enabled: true,
        tokens: {
          eip155: ['eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831'],
        },
      });
    });

    it('uses the transaction override enabled value over the default', () => {
      const state = getMockState({
        confirmations_pay_post_quote: {
          default: { enabled: true },
          overrides: {
            perpsWithdraw: { enabled: false },
          },
        },
      });

      expect(selectPayPostQuoteConfig(state, 'perpsWithdraw')).toStrictEqual({
        enabled: false,
        tokens: undefined,
      });
    });

    it('inherits default enabled when the transaction override only defines tokens', () => {
      const state = getMockState({
        confirmations_pay_post_quote: {
          default: { enabled: true },
          overrides: {
            perpsWithdraw: {
              tokens: {
                eip155: ['eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831'],
              },
            },
          },
        },
      });

      expect(selectPayPostQuoteConfig(state, 'perpsWithdraw')).toStrictEqual({
        enabled: true,
        tokens: {
          eip155: ['eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831'],
        },
      });
    });
  });
});
