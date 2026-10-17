import {
  getRemoteFeatureFlags,
  RemoteFeatureFlagsState,
} from './remote-feature-flags';

describe('#getRemoteFeatureFlags', () => {
  it('returns the effective flags from controller state without copying them', () => {
    const remoteFeatureFlags = {
      flag1: { enabled: true },
      flag2: false,
    };
    const state: RemoteFeatureFlagsState = {
      metamask: {
        remoteFeatureFlags,
      },
    };

    expect(getRemoteFeatureFlags(state)).toBe(remoteFeatureFlags);
  });
});
