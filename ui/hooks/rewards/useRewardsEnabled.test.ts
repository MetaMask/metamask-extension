import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import { useRewardsEnabled } from './useRewardsEnabled';

describe('useRewardsEnabled', () => {
  describe('with boolean feature flags', () => {
    it('should return true when both useExternalServices and rewardsEnabled feature flag are true', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          remoteFeatureFlags: {
            rewardsEnabled: true,
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useRewardsEnabled(),
        state,
      );

      expect(result.current).toBe(true);
    });

    it('should return false when useExternalServices is false', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: false,
          remoteFeatureFlags: {
            rewardsEnabled: true,
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useRewardsEnabled(),
        state,
      );

      expect(result.current).toBe(false);
    });

    it('should return false when rewardsEnabled feature flag is false', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          remoteFeatureFlags: {
            rewardsEnabled: false,
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useRewardsEnabled(),
        state,
      );

      expect(result.current).toBe(false);
    });

    it('should return false when both useExternalServices and rewardsEnabled feature flag are false', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: false,
          remoteFeatureFlags: {
            rewardsEnabled: false,
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useRewardsEnabled(),
        state,
      );

      expect(result.current).toBe(false);
    });

    it('should return false when useExternalServices is undefined', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          // useExternalServices is undefined
          remoteFeatureFlags: {
            rewardsEnabled: true,
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useRewardsEnabled(),
        state,
      );

      expect(result.current).toBe(false);
    });

    it('should return false when rewardsEnabled feature flag is undefined', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          remoteFeatureFlags: {
            // rewardsEnabled is undefined
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useRewardsEnabled(),
        state,
      );

      expect(result.current).toBe(false);
    });
  });

  describe('with VersionGatedFeatureFlag', () => {
    it('should return true when useExternalServices is true and VersionGatedFeatureFlag is enabled with valid version', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          remoteFeatureFlags: {
            rewardsEnabled: {
              enabled: true,
              minimumVersion: '12.0.0',
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useRewardsEnabled(),
        state,
      );

      expect(result.current).toBe(true);
    });

    it('should return false when VersionGatedFeatureFlag is disabled', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          remoteFeatureFlags: {
            rewardsEnabled: {
              enabled: false,
              minimumVersion: '12.0.0',
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useRewardsEnabled(),
        state,
      );

      expect(result.current).toBe(false);
    });

    it('should return false when VersionGatedFeatureFlag has invalid structure', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          remoteFeatureFlags: {
            rewardsEnabled: {
              enabled: true,
              minimumVersion: null, // Invalid structure
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useRewardsEnabled(),
        state,
      );

      expect(result.current).toBe(false);
    });

    it('should return false when useExternalServices is false even with valid VersionGatedFeatureFlag', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: false,
          remoteFeatureFlags: {
            rewardsEnabled: {
              enabled: true,
              minimumVersion: '12.0.0',
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useRewardsEnabled(),
        state,
      );

      expect(result.current).toBe(false);
    });
  });

  describe('memoization behavior', () => {
    it('should return consistent results for the same inputs', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          remoteFeatureFlags: {
            rewardsEnabled: true,
          },
        },
      };

      const { result, rerender } = renderHookWithProvider(
        () => useRewardsEnabled(),
        state,
      );
      const firstResult = result.current;

      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(true);
      expect(secondResult).toBe(true);
    });

    it('should return different results for different useExternalServices values', () => {
      const stateWithExternalServicesTrue = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          remoteFeatureFlags: {
            rewardsEnabled: true,
          },
        },
      };

      const stateWithExternalServicesFalse = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: false,
          remoteFeatureFlags: {
            rewardsEnabled: true,
          },
        },
      };

      const { result: resultTrue } = renderHookWithProvider(
        () => useRewardsEnabled(),
        stateWithExternalServicesTrue,
      );
      const { result: resultFalse } = renderHookWithProvider(
        () => useRewardsEnabled(),
        stateWithExternalServicesFalse,
      );

      expect(resultTrue.current).toBe(true);
      expect(resultFalse.current).toBe(false);
    });

    it('should return different results for different rewardsEnabled feature flag values', () => {
      const stateWithRewardsTrue = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          remoteFeatureFlags: {
            rewardsEnabled: true,
          },
        },
      };

      const stateWithRewardsFalse = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          useExternalServices: true,
          remoteFeatureFlags: {
            rewardsEnabled: false,
          },
        },
      };

      const { result: resultTrue } = renderHookWithProvider(
        () => useRewardsEnabled(),
        stateWithRewardsTrue,
      );
      const { result: resultFalse } = renderHookWithProvider(
        () => useRewardsEnabled(),
        stateWithRewardsFalse,
      );

      expect(resultTrue.current).toBe(true);
      expect(resultFalse.current).toBe(false);
    });
  });
});
