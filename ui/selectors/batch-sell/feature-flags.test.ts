import semver from 'semver';
import { BatchSellFeatureFlag } from '../../../shared/lib/batch-sell-feature-flags';
import { KeyringType } from '../../../shared/constants/keyring';
import { getIsBatchSellEnabled } from './feature-flags';

jest.mock('semver');
jest.mock('../../../package.json', () => ({ version: '14.11.0' }));

const MOCK_ACCOUNT_ID = 'mock-account-id';

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      batchSell?: BatchSellFeatureFlag;
    };
    internalAccounts: {
      accounts: Record<
        string,
        { metadata: { keyring: { type: string } } }
      >;
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
    const state = getMockState({ minimumVersion: '14.0.0' }, KeyringType.ledger);
    expect(getIsBatchSellEnabled(state)).toBe(false);
  });

  it('returns false when a Trezor hardware wallet account is selected', () => {
    semverGteMock.mockReturnValue(true);
    const state = getMockState({ minimumVersion: '14.0.0' }, KeyringType.trezor);
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
