import {
  ASSETS_UNIFY_STATE_FLAG,
  isAssetsUnifyStateFeatureEnabled,
} from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../shared/lib/environment';
import {
  getAssetsUnifyStateRemoteFeatureFlag,
  getIsAssetsUnifyStateEnabled,
  getIsTokenListControllerDeprecated,
} from './feature-flags';

// Opt out of the global `isAssetsUnifyStateFeatureEnabled` mock (see test/jest/setup.js)
// and provide the pure flag-evaluation logic without the IN_TEST bypass
// (test/helpers/setup-helper.js sets process.env.IN_TEST=true for all unit tests,
// so using jest.requireActual here would make the function always return true,
// breaking tests that exercise the disabled-flag path).
jest.mock('../../../shared/lib/assets-unify-state/remote-feature-flag', () => ({
  ...jest.requireActual(
    '../../../shared/lib/assets-unify-state/remote-feature-flag',
  ),
  isAssetsUnifyStateFeatureEnabled: jest.fn(
    (
      featureFlag:
        | { enabled: boolean; featureVersion: string }
        | undefined
        | null,
      featureVersion: string,
    ) =>
      Boolean(featureFlag?.enabled) &&
      featureFlag?.featureVersion === featureVersion,
  ),
}));

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

  describe('getIsTokenListControllerDeprecated', () => {
    const buildState = (
      deprecatedControllers: string[] = ['TokenListController'],
    ) => ({
      metamask: {
        remoteFeatureFlags: {
          [ASSETS_UNIFY_STATE_FLAG]: {
            enabled: true,
            featureVersion: '1',
            minimumVersion: '13.33.0',
            deprecatedControllers,
          },
        },
      },
    });

    const setAssetsUnifyStateEnabled = (enabled: boolean) => {
      jest
        .mocked(getIsAssetsUnifiedStateIncludedInBuild)
        .mockReturnValue(enabled);
      jest.mocked(isAssetsUnifyStateFeatureEnabled).mockReturnValue(enabled);
    };

    it('returns true in test environments regardless of flag state', () => {
      // process.env.IN_TEST is always true in Jest (set by test/helpers/setup-helper.js)
      setAssetsUnifyStateEnabled(false);

      expect(getIsTokenListControllerDeprecated(buildState())).toBe(true);
    });

    describe('outside test environments', () => {
      let originalInTest: string | undefined;

      beforeEach(() => {
        originalInTest = process.env.IN_TEST;
        delete process.env.IN_TEST;
      });

      afterEach(() => {
        process.env.IN_TEST = originalInTest;
      });

      it('returns true when assets-unify-state is enabled and the controller is deprecated', () => {
        setAssetsUnifyStateEnabled(true);

        expect(getIsTokenListControllerDeprecated(buildState())).toBe(true);
      });

      it('returns false when assets-unify-state is disabled', () => {
        setAssetsUnifyStateEnabled(false);

        expect(getIsTokenListControllerDeprecated(buildState())).toBe(false);
      });

      it('returns false when the controller is not in the deprecated list', () => {
        setAssetsUnifyStateEnabled(true);

        expect(
          getIsTokenListControllerDeprecated(
            buildState(['SomeOtherController']),
          ),
        ).toBe(false);
      });

      it('returns false when deprecatedControllers is absent from the flag', () => {
        setAssetsUnifyStateEnabled(true);

        const state = {
          metamask: {
            remoteFeatureFlags: {
              [ASSETS_UNIFY_STATE_FLAG]: { enabled: true, featureVersion: '1' },
            },
          },
        };

        expect(getIsTokenListControllerDeprecated(state)).toBe(false);
      });
    });
  });
});
