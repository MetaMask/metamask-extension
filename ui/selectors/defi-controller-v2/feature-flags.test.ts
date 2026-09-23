import { DEFI_CONTROLLER_V2_FLAG } from '../../../shared/lib/defi-controller-v2/remote-feature-flag';
import {
  getDefiControllerV2RemoteFeatureFlag,
  getIsDefiControllerV2Enabled,
} from './feature-flags';

const buildState = (
  remoteFeatureFlags: Record<string, unknown> = {},
): { metamask: { remoteFeatureFlags: Record<string, unknown> } } => ({
  metamask: {
    remoteFeatureFlags,
  },
});

describe('DeFi Controller V2 Feature Flags', () => {
  describe('getDefiControllerV2RemoteFeatureFlag', () => {
    it('returns the feature flag when it exists and is valid', () => {
      expect(
        getDefiControllerV2RemoteFeatureFlag(
          buildState({
            [DEFI_CONTROLLER_V2_FLAG]: { enabled: true },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any,
        ),
      ).toEqual({
        enabled: true,
      });
    });

    it('returns undefined when feature flag does not exist', () => {
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getDefiControllerV2RemoteFeatureFlag(buildState() as any),
      ).toBeUndefined();
    });

    it('returns undefined when feature flag has invalid structure', () => {
      expect(
        getDefiControllerV2RemoteFeatureFlag(
          buildState({
            [DEFI_CONTROLLER_V2_FLAG]: { invalid: 'structure' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any,
        ),
      ).toBeUndefined();
    });
  });

  describe('getIsDefiControllerV2Enabled', () => {
    it('returns true when enabled is true', () => {
      expect(
        getIsDefiControllerV2Enabled(
          buildState({
            [DEFI_CONTROLLER_V2_FLAG]: { enabled: true },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any,
        ),
      ).toBe(true);
    });

    it('returns false when enabled is false', () => {
      expect(
        getIsDefiControllerV2Enabled(
          buildState({
            [DEFI_CONTROLLER_V2_FLAG]: { enabled: false },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any,
        ),
      ).toBe(false);
    });

    it('returns false when feature flag is absent', () => {
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getIsDefiControllerV2Enabled(buildState() as any),
      ).toBe(false);
    });
  });
});
