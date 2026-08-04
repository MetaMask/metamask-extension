import { getRemoteFeatureFlagState } from '../../controllers/analytics';
import { isRampsAnalyticsEnabled } from './isRampsAnalyticsEnabled';

jest.mock('../../controllers/analytics', () => ({
  getRemoteFeatureFlagState: jest.fn(),
}));

const mockFlagState = jest.mocked(getRemoteFeatureFlagState);

describe('isRampsAnalyticsEnabled', () => {
  it('returns true when the rollout flag is on', () => {
    mockFlagState.mockReturnValue({ rampsEnabled: true });

    expect(isRampsAnalyticsEnabled()).toBe(true);
  });

  it('returns false when the rollout flag is off', () => {
    mockFlagState.mockReturnValue({ rampsEnabled: false });

    expect(isRampsAnalyticsEnabled()).toBe(false);
  });

  it('returns false when the flag is absent', () => {
    mockFlagState.mockReturnValue({});

    expect(isRampsAnalyticsEnabled()).toBe(false);
  });

  it('honours the version-gated flag shape', () => {
    mockFlagState.mockReturnValue({
      rampsEnabled: { enabled: true, minimumVersion: '9999.0.0' },
    });

    expect(isRampsAnalyticsEnabled()).toBe(false);
  });
});
