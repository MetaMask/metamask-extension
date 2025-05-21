import { type RemoteFeatureFlagsState } from '../remote-feature-flags';
import {
  type MultichainAccountsFeatureFlag,
  getIsMultichainAccountsState1Enabled,
  getIsMultichainAccountsState2Enabled,
} from './feature-flags';

type TestState = RemoteFeatureFlagsState & {
  metamask: {
    remoteFeatureFlags: {
      enableMultichainAccounts: MultichainAccountsFeatureFlag;
    };
  };
};

const disabledStateMock: MultichainAccountsFeatureFlag = {
  enabled: false,
  featureVersion: null,
  minimumVersion: null,
};

const mockState: TestState = {
  metamask: {
    remoteFeatureFlags: {
      enableMultichainAccounts: disabledStateMock,
    },
  },
};

describe('Multichain Accounts Feature Flags', () => {
  describe('getIsMultichainAccountsState1Enabled', () => {
    it('returns false for disabled state', () => {
      expect(getIsMultichainAccountsState1Enabled(mockState)).toBe(false);
    });
  });

  describe('getIsMultichainAccountsState2Enabled', () => {
    it('returns false for disabled state', () => {
      expect(getIsMultichainAccountsState2Enabled(mockState)).toBe(false);
    });
  });
});
