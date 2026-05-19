import { ASSETS_UNIFY_STATE_FLAG } from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import {
  getAssetsUnifyStateRemoteFeatureFlag,
  getIsAssetsUnifyStateEnabled,
} from './feature-flags';

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
    it('returns true when feature is enabled', () => {
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

    it('returns false when feature is disabled', () => {
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
      const state = {
        metamask: {
          remoteFeatureFlags: {},
        },
      };

      const result = getIsAssetsUnifyStateEnabled(state);

      expect(result).toBe(false);
    });

    it('returns false when feature version does not match', () => {
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
