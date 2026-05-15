/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE } from '../../../../shared/lib/transaction/enforced-simulations';
import {
  selectEnforcedSimulationsSlippage,
  selectIsEnforcedSimulationsEnabled,
  selectIsMetaMaskPayDappsEnabled,
} from './feature-flags';

type ConfirmationsPayDappsFlag = {
  enabled?: boolean;
};

type EnforcedSimulationsFlag = {
  enabled?: boolean;
  slippage?: number;
};

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      confirmations_pay_dapps?: ConfirmationsPayDappsFlag;
      confirmations_enforced_simulations?: EnforcedSimulationsFlag;
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
