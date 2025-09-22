import { type RemoteFeatureFlagsState } from '../remote-feature-flags';
import {
  type MultichainAccountsFeatureFlag,
  STATE_1_FLAG,
  STATE_2_FLAG,
  getIsMultichainAccountsState1Enabled,
  getIsMultichainAccountsState2Enabled,
} from './feature-flags';

jest.mock('../../../package.json', () => ({
  version: '15.0.0',
}));

type TestState = RemoteFeatureFlagsState & {
  metamask: {
    remoteFeatureFlags: {
      enableMultichainAccounts: MultichainAccountsFeatureFlag;
      enableMultichainAccountsState2: MultichainAccountsFeatureFlag;
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
  multichainAccountsState1Mock: MultichainAccountsFeatureFlag,
  multichainAccountsState2Mock: MultichainAccountsFeatureFlag,
): TestState =>
  Object.freeze({
    metamask: {
      remoteFeatureFlags: {
        [STATE_1_FLAG]: multichainAccountsState1Mock,
        [STATE_2_FLAG]: multichainAccountsState2Mock,
      },
    },
  });

describe('Multichain Accounts Feature Flags', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clears all mocks before each test
  });

  describe('getIsMultichainAccountsState1Enabled', () => {
    it('returns false for disabled state 1', () => {
      expect(
        getIsMultichainAccountsState1Enabled(
          getMockState(disabledStateMock, disabledStateMock),
        ),
      ).toBe(false);
    });

    it('returns true for state 1 when flag values are correct', () => {
      expect(
        getIsMultichainAccountsState1Enabled(
          getMockState(state1Mock, disabledStateMock),
        ),
      ).toBe(true);
    });

    it('returns false as the default value', () => {
      expect(
        getIsMultichainAccountsState1Enabled(
          // @ts-expect-error - overriding value in case of fetch failure
          getMockState(undefined, disabledStateMock),
        ),
      ).toBe(false);
    });
  });

  describe('getIsMultichainAccountsState2Enabled', () => {
    it('returns false for disabled state', () => {
      expect(
        getIsMultichainAccountsState2Enabled(
          getMockState(disabledStateMock, disabledStateMock),
        ),
      ).toBe(false);
    });

    it('returns true for state 2', () => {
      expect(
        getIsMultichainAccountsState2Enabled(
          getMockState(disabledStateMock, state2Mock),
        ),
      ).toBe(true);
    });

    it('returns false as the default value', () => {
      expect(
        getIsMultichainAccountsState2Enabled(
          // @ts-expect-error - overriding value in case of fetch failure
          getMockState(disabledStateMock, undefined),
        ),
      ).toBe(false);
    });
  });
});
