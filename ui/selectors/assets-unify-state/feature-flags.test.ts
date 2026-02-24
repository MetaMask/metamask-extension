import { hasMinimumRequiredVersion } from '../../../shared/lib/feature-flags/version-gating';
import {
  getAssetsUnifyStateRemoteFeatureFlag,
  getIsAssetsUnifyStateEnabled,
  ASSETS_UNIFY_STATE_FLAG,
} from './feature-flags';

jest.mock('../../../shared/lib/feature-flags/version-gating', () => ({
  hasMinimumRequiredVersion: jest.fn(),
}));

const mockHasMinimumRequiredVersion =
  hasMinimumRequiredVersion as jest.MockedFunction<
    typeof hasMinimumRequiredVersion
  >;

describe('Assets Unify State Feature Flags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to version check passing
    mockHasMinimumRequiredVersion.mockReturnValue(true);
  });
  describe('getAssetsUnifyStateRemoteFeatureFlag', () => {
    it('returns the feature flag when it exists and is valid', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: '1',
              minimumVersion: '13.50.0',
            },
          },
        },
      };

      const result = getAssetsUnifyStateRemoteFeatureFlag(state);

      expect(result).toEqual({
        enabled: true,
        featureVersion: '1',
        minimumVersion: '13.50.0',
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
    it('returns true when feature is enabled with correct version', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: '1',
              minimumVersion: '13.50.0',
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
              minimumVersion: null,
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
              minimumVersion: '13.50.0',
            },
          },
        },
      };

      const result = getIsAssetsUnifyStateEnabled(state);

      expect(result).toBe(false);
    });

    it('returns false when app version is below minimum required version', () => {
      mockHasMinimumRequiredVersion.mockReturnValue(false);

      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: '1',
              minimumVersion: '14.0.0',
            },
          },
        },
      };

      const result = getIsAssetsUnifyStateEnabled(state);

      expect(result).toBe(false);
      expect(mockHasMinimumRequiredVersion).toHaveBeenCalledWith('14.0.0');
    });

    it('returns true when app version meets minimum required version', () => {
      mockHasMinimumRequiredVersion.mockReturnValue(true);

      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: '1',
              minimumVersion: '13.0.0',
            },
          },
        },
      };

      const result = getIsAssetsUnifyStateEnabled(state);

      expect(result).toBe(true);
      expect(mockHasMinimumRequiredVersion).toHaveBeenCalledWith('13.0.0');
    });

    it('returns true when minimumVersion is null', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: '1',
              minimumVersion: null,
            },
          },
        },
      };

      const result = getIsAssetsUnifyStateEnabled(state);

      expect(result).toBe(true);
      // hasMinimumRequiredVersion should not be called when minimumVersion is null
      expect(mockHasMinimumRequiredVersion).not.toHaveBeenCalled();
    });
  });
});
