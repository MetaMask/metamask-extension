import {
  ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG,
  getEnabledAdvancedPermissions,
} from './feature-flags';

describe('getEnabledAdvancedPermissions', () => {
  let originalGatorEnabledPermissionTypes: string | undefined;
  const remoteFeatureFlagSource = {
    remoteFeatureFlags: {
      [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
        permissions: ['native-token-stream'],
      },
    },
  };

  const restoreGatorEnabledPermissionTypes = () => {
    if (originalGatorEnabledPermissionTypes === undefined) {
      delete process.env.GATOR_ENABLED_PERMISSION_TYPES;
      return;
    }

    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      originalGatorEnabledPermissionTypes;
  };

  beforeAll(() => {
    originalGatorEnabledPermissionTypes =
      process.env.GATOR_ENABLED_PERMISSION_TYPES;
  });

  afterEach(() => {
    restoreGatorEnabledPermissionTypes();
  });

  it('returns an empty array when GATOR_ENABLED_PERMISSION_TYPES is not set', () => {
    delete process.env.GATOR_ENABLED_PERMISSION_TYPES;
    expect(
      getEnabledAdvancedPermissions(remoteFeatureFlagSource),
    ).toStrictEqual([]);
  });

  it('returns an empty array when GATOR_ENABLED_PERMISSION_TYPES is an empty string', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES = '';
    expect(
      getEnabledAdvancedPermissions(remoteFeatureFlagSource),
    ).toStrictEqual([]);
  });

  it('parses comma-separated build values', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      'native-token-stream,native-token-periodic,erc20-token-stream';

    expect(
      getEnabledAdvancedPermissions({
        remoteFeatureFlags: {
          [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
            permissions: [
              'native-token-stream',
              'native-token-periodic',
              'erc20-token-stream',
            ],
          },
        },
      }),
    ).toStrictEqual([
      'native-token-stream',
      'native-token-periodic',
      'erc20-token-stream',
    ]);
  });

  it('filters out empty strings from the build values', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      'native-token-stream,,erc20-token-stream';

    expect(
      getEnabledAdvancedPermissions({
        remoteFeatureFlags: {
          [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
            permissions: ['native-token-stream', 'erc20-token-stream'],
          },
        },
      }),
    ).toStrictEqual(['native-token-stream', 'erc20-token-stream']);
  });

  it('handles a single permission type', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES = 'native-token-stream';

    expect(
      getEnabledAdvancedPermissions({
        remoteFeatureFlags: {
          [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
            permissions: ['native-token-stream'],
          },
        },
      }),
    ).toStrictEqual(['native-token-stream']);
  });

  it('returns the intersection of build and remote permission types', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      'native-token-stream,native-token-periodic,erc20-token-stream';

    expect(
      getEnabledAdvancedPermissions({
        remoteFeatureFlags: {
          [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
            permissions: [
              'native-token-periodic',
              'erc20-token-periodic',
              'erc20-token-stream',
              'token-approval-revocation',
            ],
          },
        },
      }),
    ).toStrictEqual(['native-token-periodic', 'erc20-token-stream']);
  });

  it('allows permission types configured in both build and remote flags without a local implementation list', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      'native-token-stream,native-token-allowance';

    expect(
      getEnabledAdvancedPermissions({
        remoteFeatureFlags: {
          [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
            permissions: ['native-token-allowance'],
          },
        },
      }),
    ).toStrictEqual(['native-token-allowance']);
  });

  it('allows the remote flag to disable all permission types', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      'native-token-stream,erc20-token-stream';

    expect(
      getEnabledAdvancedPermissions({
        remoteFeatureFlags: {
          [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
            permissions: [],
          },
        },
      }),
    ).toStrictEqual([]);
  });

  it('returns an empty array when the remote flag source is missing', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      'native-token-stream,erc20-token-stream';

    expect(getEnabledAdvancedPermissions()).toStrictEqual([]);
  });

  it('returns an empty array when the remote flag is missing', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      'native-token-stream,erc20-token-stream';

    expect(
      getEnabledAdvancedPermissions({ remoteFeatureFlags: {} }),
    ).toStrictEqual([]);
  });

  it('returns an empty array when the remote flag shape is invalid', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      'native-token-stream,erc20-token-stream';

    expect(
      getEnabledAdvancedPermissions({
        remoteFeatureFlags: {
          [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: true,
        },
      }),
    ).toStrictEqual([]);
  });
});
