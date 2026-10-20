import * as manifestFlags from '../manifestFlags';
import type { RemoteFeatureFlagsState } from './remote-feature-flags';
import { getIsRampsEnabled } from './ramps';

function arrangeState(
  rampsEnabled: unknown,
): RemoteFeatureFlagsState['metamask']['remoteFeatureFlags'] {
  return {
    rampsEnabled,
  } as RemoteFeatureFlagsState['metamask']['remoteFeatureFlags'];
}

describe('getIsRampsEnabled', () => {
  let getManifestFlagsMock: jest.SpyInstance;

  beforeEach(() => {
    getManifestFlagsMock = jest
      .spyOn(manifestFlags, 'getManifestFlags')
      .mockReturnValue({ remoteFeatureFlags: {} });
  });

  afterEach(() => {
    getManifestFlagsMock.mockRestore();
  });

  it('returns true when the rampsEnabled flag is a plain boolean true', () => {
    expect(
      getIsRampsEnabled({
        metamask: { remoteFeatureFlags: arrangeState(true) },
      }),
    ).toBe(true);
  });

  it('returns false when the rampsEnabled flag is false', () => {
    expect(
      getIsRampsEnabled({
        metamask: { remoteFeatureFlags: arrangeState(false) },
      }),
    ).toBe(false);
  });

  it('returns false when the rampsEnabled flag is absent', () => {
    expect(
      getIsRampsEnabled({
        metamask: { remoteFeatureFlags: arrangeState(undefined) },
      }),
    ).toBe(false);
  });

  it('prefers the manifest flag over the state flag', () => {
    getManifestFlagsMock.mockReturnValue({
      remoteFeatureFlags: { rampsEnabled: true },
    });

    expect(
      getIsRampsEnabled({
        metamask: { remoteFeatureFlags: arrangeState(false) },
      }),
    ).toBe(true);
  });
});
