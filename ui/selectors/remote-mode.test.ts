import { FeatureFlags } from '@metamask/remote-feature-flag-controller';
import { RemoteFeatureFlagsState } from './remote-feature-flags';
import { getIsRemoteModeEnabled } from './remote-mode';

function getMockState(vaultRemoteMode?: boolean): RemoteFeatureFlagsState {
  const featureFlags: FeatureFlags = {};
  if (vaultRemoteMode !== undefined) {
    featureFlags.vaultRemoteMode = vaultRemoteMode;
  }
  return {
    metamask: {
      remoteFeatureFlags: featureFlags,
    },
  };
}

describe('Remote Mode Selectors', () => {
  describe('#getIsRemoteModeEnabled', () => {
    it('returns true if the vaultRemoteMode flag is enabled', () => {
      expect(getIsRemoteModeEnabled(getMockState(true))).toStrictEqual(true);
    });

    it('returns false if the vaultRemoteMode flag is disabled', () => {
      expect(getIsRemoteModeEnabled(getMockState(false))).toStrictEqual(false);
    });

    it('returns false if the vaultRemoteMode flag is not present', () => {
      expect(getIsRemoteModeEnabled(getMockState())).toStrictEqual(false);
    });
  });
});
