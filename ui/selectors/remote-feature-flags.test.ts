import * as manifestFlags from '../../shared/lib/manifestFlags';
import {
  getRemoteFeatureFlags,
  RemoteFeatureFlagsState,
} from './remote-feature-flags';

const MOCK_DATA = {
  manifestFlags: {
    basic: {
      flag1: true,
      flag2: false,
    },
    empty: {},
    nested: {
      flag1: { b: 3 },
      flag2: false,
    },
  },
  stateFlags: {
    basic: {
      flag1: false,
      flag3: false,
    },
    empty: {},
    withStateFlag: {
      stateFlag: true,
    },
    nested: {
      flag1: { a: 1, b: 2 },
      flag3: false,
    },
  },
};

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
      remoteFeatureFlags: MOCK_DATA.manifestFlags.basic,
    });

    const state: RemoteFeatureFlagsState = {
      metamask: {
        remoteFeatureFlags: MOCK_DATA.stateFlags.basic,
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
      remoteFeatureFlags: MOCK_DATA.manifestFlags.basic,
    });

    const state: RemoteFeatureFlagsState = {
      metamask: {
        remoteFeatureFlags: MOCK_DATA.stateFlags.empty,
      },
    };

    expect(getRemoteFeatureFlags(state)).toStrictEqual({
      flag1: true,
      flag2: false,
    });
  });

  it('returns state flags when manifest flags are empty', () => {
    getManifestFlagsMock.mockReturnValue({
      remoteFeatureFlags: MOCK_DATA.manifestFlags.empty,
    });

    const state: RemoteFeatureFlagsState = {
      metamask: {
        remoteFeatureFlags: MOCK_DATA.stateFlags.withStateFlag,
      },
    };

    expect(getRemoteFeatureFlags(state)).toStrictEqual({
      stateFlag: true,
    });
  });

  it('returns state flags when manifest flags are undefined', () => {
    getManifestFlagsMock.mockReturnValue({});

    const state: RemoteFeatureFlagsState = {
      metamask: {
        remoteFeatureFlags: MOCK_DATA.stateFlags.withStateFlag,
      },
    };

    expect(getRemoteFeatureFlags(state)).toStrictEqual({
      stateFlag: true,
    });
  });

  it('performs deep merge of manifest flags and state flags for nested objects', () => {
    getManifestFlagsMock.mockReturnValue({
      remoteFeatureFlags: MOCK_DATA.manifestFlags.nested,
    });

    const state: RemoteFeatureFlagsState = {
      metamask: {
        remoteFeatureFlags: MOCK_DATA.stateFlags.nested,
      },
    };

    expect(getRemoteFeatureFlags(state)).toStrictEqual({
      flag1: { a: 1, b: 3 },
      flag2: false,
      flag3: false,
    });
  });
});
