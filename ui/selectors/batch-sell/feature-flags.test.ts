import semver from 'semver';
import { KeyringType } from '../../../shared/constants/keyring';
import {
  BatchSellFeatureFlag,
  isBatchSellEnabled,
  getIsBatchSellEnabled,
} from './feature-flags';

jest.mock('semver');
jest.mock('../../../package.json', () => ({ version: '14.11.0' }));

const MOCK_ACCOUNT_ID = 'mock-account-id';

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      batchSell?: BatchSellFeatureFlag;
    };
    internalAccounts: {
      accounts: Record<string, { metadata: { keyring: { type: string } } }>;
      selectedAccount: string;
    };
  };
};

const getMockState = (
  batchSell?: BatchSellFeatureFlag,
  keyringType: string = KeyringType.hdKeyTree,
): MockState => ({
  metamask: {
    remoteFeatureFlags: { batchSell },
    internalAccounts: {
      accounts: {
        [MOCK_ACCOUNT_ID]: {
          metadata: { keyring: { type: keyringType } },
        },
      },
      selectedAccount: MOCK_ACCOUNT_ID,
    },
  },
});

describe('isBatchSellEnabled', () => {
  const semverGteMock = semver.gte as jest.MockedFunction<typeof semver.gte>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('invalid / missing flag values', () => {
    it('returns false when flagValue is undefined', () => {
      expect(isBatchSellEnabled(undefined)).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when flagValue is null', () => {
      expect(isBatchSellEnabled(null)).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when flagValue is a plain string', () => {
      expect(isBatchSellEnabled('14.11.0')).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when flagValue is a boolean', () => {
      expect(isBatchSellEnabled(true)).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when flagValue is an empty object', () => {
      expect(isBatchSellEnabled({})).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when minimumVersion is missing', () => {
      expect(isBatchSellEnabled({ otherProp: '14.0.0' })).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when minimumVersion is not a string', () => {
      expect(isBatchSellEnabled({ minimumVersion: 14110 })).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });
  });

  describe('version gating', () => {
    it('returns true when app version is greater than minimumVersion', () => {
      semverGteMock.mockReturnValue(true);
      expect(isBatchSellEnabled({ minimumVersion: '14.0.0' })).toBe(true);
      expect(semverGteMock).toHaveBeenCalledWith('14.11.0', '14.0.0');
    });

    it('returns true on exact version match', () => {
      semverGteMock.mockReturnValue(true);
      expect(isBatchSellEnabled({ minimumVersion: '14.11.0' })).toBe(true);
      expect(semverGteMock).toHaveBeenCalledWith('14.11.0', '14.11.0');
    });

    it('returns false when app version is below minimumVersion', () => {
      semverGteMock.mockReturnValue(false);
      expect(isBatchSellEnabled({ minimumVersion: '15.0.0' })).toBe(false);
      expect(semverGteMock).toHaveBeenCalledWith('14.11.0', '15.0.0');
    });
  });

  describe('error handling', () => {
    it('returns false when semver.gte throws', () => {
      semverGteMock.mockImplementation(() => {
        throw new Error('Invalid version');
      });
      expect(isBatchSellEnabled({ minimumVersion: 'not-a-semver' })).toBe(
        false,
      );
      expect(semverGteMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe('getIsBatchSellEnabled', () => {
  const semverGteMock = semver.gte as jest.MockedFunction<typeof semver.gte>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false when batchSell flag is absent', () => {
    const state = getMockState(undefined);
    expect(getIsBatchSellEnabled(state)).toBe(false);
    expect(semverGteMock).not.toHaveBeenCalled();
  });

  it('returns false when remoteFeatureFlags is empty', () => {
    const state = {
      metamask: {
        remoteFeatureFlags: {},
        internalAccounts: {
          accounts: {
            [MOCK_ACCOUNT_ID]: {
              metadata: { keyring: { type: KeyringType.hdKeyTree } },
            },
          },
          selectedAccount: MOCK_ACCOUNT_ID,
        },
      },
    };
    expect(getIsBatchSellEnabled(state)).toBe(false);
    expect(semverGteMock).not.toHaveBeenCalled();
  });

  it('returns true when app version meets minimumVersion and account is not a hardware wallet', () => {
    semverGteMock.mockReturnValue(true);
    const state = getMockState({ minimumVersion: '14.0.0' });
    expect(getIsBatchSellEnabled(state)).toBe(true);
    expect(semverGteMock).toHaveBeenCalledWith('14.11.0', '14.0.0');
  });

  it('returns false when app version is below minimumVersion', () => {
    semverGteMock.mockReturnValue(false);
    const state = getMockState({ minimumVersion: '15.0.0' });
    expect(getIsBatchSellEnabled(state)).toBe(false);
    expect(semverGteMock).toHaveBeenCalledWith('14.11.0', '15.0.0');
  });

  it('returns false when a hardware wallet account is selected, even if flag is enabled', () => {
    semverGteMock.mockReturnValue(true);
    const state = getMockState(
      { minimumVersion: '14.0.0' },
      KeyringType.ledger,
    );
    expect(getIsBatchSellEnabled(state)).toBe(false);
  });

  it('returns false when a Trezor hardware wallet account is selected', () => {
    semverGteMock.mockReturnValue(true);
    const state = getMockState(
      { minimumVersion: '14.0.0' },
      KeyringType.trezor,
    );
    expect(getIsBatchSellEnabled(state)).toBe(false);
  });

  it('returns true when an imported (non-hardware) account is selected', () => {
    semverGteMock.mockReturnValue(true);
    const state = getMockState(
      { minimumVersion: '14.0.0' },
      KeyringType.imported,
    );
    expect(getIsBatchSellEnabled(state)).toBe(true);
  });
});
