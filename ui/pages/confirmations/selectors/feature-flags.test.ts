/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { selectIsMetaMaskPayDappsEnabled } from './feature-flags';

type ConfirmationsPayDappsFlag = {
  enabled?: boolean;
};

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      confirmations_pay_dapps?: ConfirmationsPayDappsFlag;
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
});
