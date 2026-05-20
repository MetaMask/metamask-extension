import semver from 'semver';
import { BatchSellFeatureFlag } from '../../../shared/lib/batch-sell-feature-flags';
import { getIsBatchSellEnabled } from './feature-flags';

jest.mock('semver');
jest.mock('../../../package.json', () => ({ version: '14.11.0' }));

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      batchSell?: BatchSellFeatureFlag;
    };
  };
};

const getMockState = (batchSell?: BatchSellFeatureFlag): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      batchSell,
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
    const state = { metamask: { remoteFeatureFlags: {} } };
    expect(getIsBatchSellEnabled(state)).toBe(false);
    expect(semverGteMock).not.toHaveBeenCalled();
  });

  it('returns true when app version meets minimumVersion', () => {
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
});
