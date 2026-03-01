/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { selectIsMetaMaskPayDappsEnabled } from './feature-flags';

type ConfirmationsPayFlag = {
  dappsEnabled?: boolean;
};

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      confirmations_pay?: ConfirmationsPayFlag;
    };
  };
};

const getMockState = (confirmations_pay?: ConfirmationsPayFlag): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      ...(confirmations_pay !== undefined && { confirmations_pay }),
    },
  },
});

describe('Confirmations Pay Feature Flags', () => {
  describe('selectIsMetaMaskPayDappsEnabled', () => {
    it('returns true when dappsEnabled is true', () => {
      const state = getMockState({ dappsEnabled: true });
      expect(selectIsMetaMaskPayDappsEnabled(state)).toBe(true);
    });

    it('returns false when dappsEnabled is false', () => {
      const state = getMockState({ dappsEnabled: false });
      expect(selectIsMetaMaskPayDappsEnabled(state)).toBe(false);
    });

    it('defaults to false when confirmations_pay flag is not set', () => {
      const state = getMockState();
      expect(selectIsMetaMaskPayDappsEnabled(state)).toBe(false);
    });

    it('defaults to false when confirmations_pay is an empty object', () => {
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
