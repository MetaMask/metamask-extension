import * as manifestFlags from '../../shared/lib/manifestFlags';
import { getRemoteFeatureFlags } from './remote-feature-flag';

describe('#getRemoteFeatureFlags', () => {
  let getManifestFlagsMock: jest.SpyInstance;

  beforeEach(() => {
    // Mock the getManifestFlags function before each test
    getManifestFlagsMock = jest
      .spyOn(manifestFlags, 'getManifestFlags')
      .mockReturnValue({});
  });

  afterEach(() => {
    // Clean up mock after each test
    getManifestFlagsMock.mockRestore();
  });

  it('performs shallow merge of manifest flags and state flags', () => {
    getManifestFlagsMock.mockReturnValue({
      remoteFeatureFlags: {
        flag1: true,
        flag2: false,
      },
    });

    const state = {
      metamask: {
        remoteFeatureFlags: {
          flag1: false,
          flag3: false,
        },
      },
    };

    expect(getRemoteFeatureFlags(state)).toStrictEqual({
      flag1: true,
      flag2: false,
      flag3: false,
    });
  });

  it('returns manifest flags when they are only provided by manifest-flags.json', () => {
    getManifestFlagsMock.mockReturnValue({
      remoteFeatureFlags: {
        manifestFlag1: true,
        manifestFlag2: false,
      },
    });

    const state = {
      metamask: {
        remoteFeatureFlags: {},
      },
    };

    expect(getRemoteFeatureFlags(state)).toStrictEqual({
      manifestFlag1: true,
      manifestFlag2: false,
    });
  });

  it('returns state flags when manifest flags are empty', () => {
    getManifestFlagsMock.mockReturnValue({
      remoteFeatureFlags: {},
    });

    const state = {
      metamask: {
        remoteFeatureFlags: {
          stateFlag: true,
        },
      },
    };

    expect(getRemoteFeatureFlags(state)).toStrictEqual({
      stateFlag: true,
    });
  });

  it('returns state flags when manifest flags are undefined', () => {
    getManifestFlagsMock.mockReturnValue({});

    const state = {
      metamask: {
        remoteFeatureFlags: {
          stateFlag: true,
        },
      },
    };

    expect(getRemoteFeatureFlags(state)).toStrictEqual({
      stateFlag: true,
    });
  });
});
