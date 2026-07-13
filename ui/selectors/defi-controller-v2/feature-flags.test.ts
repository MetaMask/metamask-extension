import { DEFI_CONTROLLER_V2_FLAG } from '../../../shared/lib/defi-controller-v2/remote-feature-flag';
import {
  getDefiControllerV2RemoteFeatureFlag,
  getIsDefiControllerV2Enabled,
} from './feature-flags';

type MockState = {
  metamask: {
    remoteFeatureFlags: Record<string, unknown>;
  };
};

const buildState = (
  remoteFeatureFlags: Record<string, unknown> = {},
): MockState => ({
  metamask: {
    remoteFeatureFlags,
  },
});

describe('DeFi Controller V2 Feature Flags', () => {
  describe('getDefiControllerV2RemoteFeatureFlag', () => {
    it('returns the feature flag when it exists and is valid', () => {
      const state = buildState({
        [DEFI_CONTROLLER_V2_FLAG]: { enabled: true },
      });

      expect(getDefiControllerV2RemoteFeatureFlag(state)).toEqual({
        enabled: true,
      });
    });

    it('returns undefined when feature flag does not exist', () => {
      expect(
        getDefiControllerV2RemoteFeatureFlag(buildState()),
      ).toBeUndefined();
    });

    it('returns undefined when feature flag has invalid structure', () => {
      const state = buildState({
        [DEFI_CONTROLLER_V2_FLAG]: { invalid: 'structure' },
      });

      expect(getDefiControllerV2RemoteFeatureFlag(state)).toBeUndefined();
    });
  });

  describe('getIsDefiControllerV2Enabled', () => {
    it('returns true when enabled is true', () => {
      const state = buildState({
        [DEFI_CONTROLLER_V2_FLAG]: { enabled: true },
      });

      expect(getIsDefiControllerV2Enabled(state)).toBe(true);
    });

    it('returns false when enabled is false', () => {
      const state = buildState({
        [DEFI_CONTROLLER_V2_FLAG]: { enabled: false },
      });

      expect(getIsDefiControllerV2Enabled(state)).toBe(false);
    });

    it('returns false when feature flag is absent', () => {
      expect(getIsDefiControllerV2Enabled(buildState())).toBe(false);
    });
  });
});
