import { getIsPerpsEnabled } from './feature-flags';

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      perpsEnabled?: boolean;
    };
  };
};

const getMockState = (perpsEnabled?: boolean): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      perpsEnabled,
    },
  },
});

describe('Perps Feature Flags', () => {
  describe('getIsPerpsEnabled', () => {
    it('returns true when perpsEnabled flag is true', () => {
      const state = getMockState(true);
      expect(getIsPerpsEnabled(state)).toBe(true);
    });

    it('returns false when perpsEnabled flag is false', () => {
      const state = getMockState(false);
      expect(getIsPerpsEnabled(state)).toBe(false);
    });

    it('returns false when perpsEnabled flag is undefined', () => {
      const state = getMockState(undefined);
      expect(getIsPerpsEnabled(state)).toBe(false);
    });

    it('returns false when remoteFeatureFlags is empty', () => {
      const state = { metamask: { remoteFeatureFlags: {} } };
      expect(getIsPerpsEnabled(state)).toBe(false);
    });
  });
});
