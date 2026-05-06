import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import {
  getIsComplianceEnabled,
  selectAreAnyWalletsBlocked,
  selectComplianceLastCheckedAt,
  selectIsWalletBlocked,
  selectWalletComplianceStatusMap,
} from './compliance';

jest.mock('../../shared/lib/manifestFlags', () => {
  const manifestFlags = { remoteFeatureFlags: {} };
  return {
    getManifestFlags: () => manifestFlags,
  };
});

const BLOCKED_ADDRESS = '0xblocked';
const COMPLIANT_ADDRESS = '0xcompliant';

type RemoteFeatureFlagValue =
  RemoteFeatureFlagControllerState['remoteFeatureFlags'][string];

function getState({
  complianceEnabled,
  walletComplianceStatusMap,
  lastCheckedAt,
}: {
  complianceEnabled?: RemoteFeatureFlagValue;
  walletComplianceStatusMap?: Record<
    string,
    { address: string; blocked: boolean; checkedAt: string }
  >;
  lastCheckedAt?: string | null;
} = {}) {
  const remoteFeatureFlags: RemoteFeatureFlagControllerState['remoteFeatureFlags'] =
    {};
  if (complianceEnabled !== undefined) {
    remoteFeatureFlags.complianceEnabled = complianceEnabled;
  }

  return {
    metamask: {
      remoteFeatureFlags,
      walletComplianceStatusMap,
      lastCheckedAt,
    },
  };
}

describe('compliance selectors', () => {
  describe('getIsComplianceEnabled', () => {
    it('defaults false', () => {
      expect(getIsComplianceEnabled(getState())).toBe(false);
    });

    it('accepts boolean feature flag values', () => {
      expect(getIsComplianceEnabled(getState({ complianceEnabled: true }))).toBe(
        true,
      );
      expect(getIsComplianceEnabled(getState({ complianceEnabled: false }))).toBe(
        false,
      );
    });

    it('accepts enabled version-gated feature flag values', () => {
      expect(
        getIsComplianceEnabled(
          getState({
            complianceEnabled: { enabled: true, minimumVersion: '0.0.0' },
          }),
        ),
      ).toBe(true);
    });

    it('rejects disabled or invalid version-gated feature flag values', () => {
      expect(
        getIsComplianceEnabled(
          getState({
            complianceEnabled: { enabled: false, minimumVersion: '0.0.0' },
          }),
        ),
      ).toBe(false);
      expect(
        getIsComplianceEnabled(
          getState({
            complianceEnabled: { enabled: true, minimumVersion: null },
          }),
        ),
      ).toBe(false);
    });
  });

  describe('wallet status selectors', () => {
    const checkedAt = '2026-05-05T00:00:00.000Z';
    const walletComplianceStatusMap = {
      [BLOCKED_ADDRESS]: {
        address: BLOCKED_ADDRESS,
        blocked: true,
        checkedAt,
      },
      [COMPLIANT_ADDRESS]: {
        address: COMPLIANT_ADDRESS,
        blocked: false,
        checkedAt,
      },
    };

    it('returns true for a cached blocked address', () => {
      expect(
        selectIsWalletBlocked(BLOCKED_ADDRESS)(
          getState({ walletComplianceStatusMap }),
        ),
      ).toBe(true);
    });

    it('returns false for a cached compliant address', () => {
      expect(
        selectIsWalletBlocked(COMPLIANT_ADDRESS)(
          getState({ walletComplianceStatusMap }),
        ),
      ).toBe(false);
    });

    it('returns false for unknown or missing state', () => {
      expect(selectIsWalletBlocked('0xunknown')(getState())).toBe(false);
      expect(
        selectAreAnyWalletsBlocked([BLOCKED_ADDRESS])(
          getState({ walletComplianceStatusMap: undefined }),
        ),
      ).toBe(false);
    });

    it('returns true when any address in an array is blocked', () => {
      expect(
        selectAreAnyWalletsBlocked([COMPLIANT_ADDRESS, BLOCKED_ADDRESS])(
          getState({ walletComplianceStatusMap }),
        ),
      ).toBe(true);
    });

    it('returns the cached status map and last checked timestamp', () => {
      const state = getState({ walletComplianceStatusMap, lastCheckedAt: checkedAt });

      expect(selectWalletComplianceStatusMap(state)).toBe(
        walletComplianceStatusMap,
      );
      expect(selectComplianceLastCheckedAt(state)).toBe(checkedAt);
    });
  });
});
