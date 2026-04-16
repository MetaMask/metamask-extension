import { ASSETS_UNIFY_STATE_FLAG } from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../shared/lib/environment';
import {
  getAssetsUnifyStateRemoteFeatureFlag,
  getIsAssetsUnifyStateEnabled,
} from './feature-flags';

jest.mock('../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../shared/lib/environment'),
  getIsAssetsUnifiedStateIncludedInBuild: jest.fn(),
}));

describe('Assets Unify State Feature Flags', () => {
  describe('getAssetsUnifyStateRemoteFeatureFlag', () => {
    it('returns the feature flag when it exists and is valid', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: '1',
            },
          },
        },
      };

      const result = getAssetsUnifyStateRemoteFeatureFlag(state);

      expect(result).toEqual({
        enabled: true,
        featureVersion: '1',
      });
    });

    it('returns undefined when feature flag does not exist', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {},
        },
      };

      const result = getAssetsUnifyStateRemoteFeatureFlag(state);

      expect(result).toBeUndefined();
    });

    it('returns undefined when feature flag has invalid structure', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              invalid: 'structure',
            },
          },
        },
      };

      const result = getAssetsUnifyStateRemoteFeatureFlag(state);

      expect(result).toBeUndefined();
    });
  });

  describe('getIsAssetsUnifyStateEnabled', () => {
    it('returns true when build-time flag and remote flag are both enabled', () => {
      jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(true);
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: '1',
            },
          },
        },
      };

      const result = getIsAssetsUnifyStateEnabled(state);

      expect(result).toBe(true);
    });

    it('returns false when build-time flag is disabled', () => {
      jest
        .mocked(getIsAssetsUnifiedStateIncludedInBuild)
        .mockReturnValue(false);
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: '1',
            },
          },
        },
      };

      const result = getIsAssetsUnifyStateEnabled(state);

      expect(result).toBe(false);
    });

    it('returns false when remote feature is disabled', () => {
      jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(true);
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: false,
              featureVersion: null,
            },
          },
        },
      };

      const result = getIsAssetsUnifyStateEnabled(state);

      expect(result).toBe(false);
    });

    it('returns false when feature flag does not exist', () => {
      jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(true);
      const state = {
        metamask: {
          remoteFeatureFlags: {},
        },
      };

      const result = getIsAssetsUnifyStateEnabled(state);

      expect(result).toBe(false);
    });

    it('returns false when feature version does not match', () => {
      jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(true);
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: '2', // Different version
            },
          },
        },
      };

      const result = getIsAssetsUnifyStateEnabled(state);

      expect(result).toBe(false);
    });
  });
});
