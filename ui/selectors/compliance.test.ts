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

const LOWERCASE_BLOCKED_EVM_ADDRESS =
  '0x52908400098527886e0f7030069857d2e4169ee7';
const CHECKSUMMED_BLOCKED_EVM_ADDRESS =
  '0x52908400098527886E0F7030069857D2E4169EE7';
const COMPLIANT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const NON_EVM_ADDRESS = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH';

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
      expect(
        getIsComplianceEnabled(getState({ complianceEnabled: true })),
      ).toBe(true);
      expect(
        getIsComplianceEnabled(getState({ complianceEnabled: false })),
      ).toBe(false);
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
      [LOWERCASE_BLOCKED_EVM_ADDRESS]: {
        address: LOWERCASE_BLOCKED_EVM_ADDRESS,
        blocked: true,
        checkedAt,
      },
      [COMPLIANT_ADDRESS]: {
        address: COMPLIANT_ADDRESS,
        blocked: false,
        checkedAt,
      },
      [NON_EVM_ADDRESS]: {
        address: NON_EVM_ADDRESS,
        blocked: true,
        checkedAt,
      },
    };

    it('returns true for a cached blocked address', () => {
      expect(
        selectIsWalletBlocked(LOWERCASE_BLOCKED_EVM_ADDRESS)(
          getState({ walletComplianceStatusMap }),
        ),
      ).toBe(true);
    });

    it('returns true for a checksummed EVM address when the cache holds the lowercase form', () => {
      expect(
        selectIsWalletBlocked(CHECKSUMMED_BLOCKED_EVM_ADDRESS)(
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
      expect(
        selectIsWalletBlocked('0x0000000000000000000000000000000000000001')(
          getState(),
        ),
      ).toBe(false);
      expect(
        selectAreAnyWalletsBlocked([LOWERCASE_BLOCKED_EVM_ADDRESS])(
          getState({ walletComplianceStatusMap: undefined }),
        ),
      ).toBe(false);
    });

    it('uses exact match only for non-EVM addresses', () => {
      expect(
        selectIsWalletBlocked(NON_EVM_ADDRESS.toLowerCase())(
          getState({ walletComplianceStatusMap }),
        ),
      ).toBe(false);
    });

    it('returns true when any address in an array is blocked', () => {
      expect(
        selectAreAnyWalletsBlocked([
          COMPLIANT_ADDRESS,
          LOWERCASE_BLOCKED_EVM_ADDRESS,
        ])(getState({ walletComplianceStatusMap })),
      ).toBe(true);
    });

    it('returns true for batch check with checksummed blocked address', () => {
      expect(
        selectAreAnyWalletsBlocked([
          COMPLIANT_ADDRESS,
          CHECKSUMMED_BLOCKED_EVM_ADDRESS,
        ])(getState({ walletComplianceStatusMap })),
      ).toBe(true);
    });

    it('returns the cached status map and last checked timestamp', () => {
      const state = getState({
        walletComplianceStatusMap,
        lastCheckedAt: checkedAt,
      });

      expect(selectWalletComplianceStatusMap(state)).toBe(
        walletComplianceStatusMap,
      );
      expect(selectComplianceLastCheckedAt(state)).toBe(checkedAt);
    });
  });
});
