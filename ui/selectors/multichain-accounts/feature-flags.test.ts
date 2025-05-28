import { type RemoteFeatureFlagsState } from '../remote-feature-flags';
import {
  type MultichainAccountsFeatureFlag,
  getIsMultichainAccountsState1Enabled,
  getIsMultichainAccountsState2Enabled,
} from './feature-flags';

jest.mock('../../../package.json', () => ({
  version: '12.0.0',
}));

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

const state1Mock: MultichainAccountsFeatureFlag = {
  enabled: true,
  featureVersion: '1',
  minimumVersion: '13.0.0',
};

const state2Mock: MultichainAccountsFeatureFlag = {
  enabled: true,
  featureVersion: '2',
  minimumVersion: '14.0.0',
};

const getMockState = (
  multichainAccountsFeatureFlagMock: MultichainAccountsFeatureFlag,
): TestState =>
  Object.freeze({
    metamask: {
      remoteFeatureFlags: {
        enableMultichainAccounts: multichainAccountsFeatureFlagMock,
      },
    },
  });

describe('Multichain Accounts Feature Flags', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clears all mocks before each test
  });

  describe('getIsMultichainAccountsState1Enabled', () => {
    it('returns false for disabled state', () => {
      expect(
        getIsMultichainAccountsState1Enabled(getMockState(disabledStateMock)),
      ).toBe(false);
    });

    it('returns true for state 1', () => {
      expect(
        getIsMultichainAccountsState1Enabled(getMockState(state1Mock)),
      ).toBe(true);
    });

    it('returns true for state 2', () => {
      expect(
        getIsMultichainAccountsState1Enabled(getMockState(state2Mock)),
      ).toBe(true);
    });
  });

  describe('getIsMultichainAccountsState2Enabled', () => {
    it('returns false for disabled state', () => {
      expect(
        getIsMultichainAccountsState2Enabled(getMockState(disabledStateMock)),
      ).toBe(false);
    });

    it('returns false for state 1', () => {
      expect(
        getIsMultichainAccountsState2Enabled(getMockState(state1Mock)),
      ).toBe(false);
    });

    it('returns true for state 2', () => {
      expect(
        getIsMultichainAccountsState2Enabled(getMockState(state2Mock)),
      ).toBe(true);
    });
  });
});
