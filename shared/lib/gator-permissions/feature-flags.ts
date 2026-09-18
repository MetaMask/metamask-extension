import type { SupportedPermissionType } from '@metamask/gator-permissions-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';

export const ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG =
  'enabledAdvancedPermissions';

type AdvancedPermissionsFeatureFlag = {
  permissions?: unknown;
};

type AdvancedPermissionsFeatureFlagSource = Pick<
  RemoteFeatureFlagControllerState,
  'remoteFeatureFlags'
>;

const isNonEmptyString = (permissionType: unknown): permissionType is string =>
  typeof permissionType === 'string' && permissionType.length > 0;

const getBuildEnabledAdvancedPermissions = (): SupportedPermissionType[] => {
  const enabled =
    process.env.GATOR_ENABLED_PERMISSION_TYPES?.toString().trim() || '';

  return enabled
    .split(',')
    .map((permissionType) => permissionType.trim())
    .filter(isNonEmptyString) as SupportedPermissionType[];
};

const getRemoteEnabledAdvancedPermissions = (
  source?: AdvancedPermissionsFeatureFlagSource,
): SupportedPermissionType[] | undefined => {
  const flag = source?.remoteFeatureFlags?.[
    ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG
  ] as AdvancedPermissionsFeatureFlag | undefined;

  if (!flag || !Array.isArray(flag.permissions)) {
    return undefined;
  }

  return flag.permissions.filter(isNonEmptyString) as SupportedPermissionType[];
};

/**
 * Returns the enabled Gator permission types for the current runtime.
 *
 * `GATOR_ENABLED_PERMISSION_TYPES` is the build-time implementation gate. When
 * the `enabled-advanced-permissions` remote flag is available, only permission
 * types present in both sources are enabled. If the remote flag is missing or
 * malformed, no permission types are enabled.
 *
 * @param source - Optional remote feature flag state.
 * @returns Enabled permission type strings, or an empty array if none are configured.
 */
export const getEnabledAdvancedPermissions = (
  source?: AdvancedPermissionsFeatureFlagSource,
): SupportedPermissionType[] => {
  const buildEnabledPermissions = getBuildEnabledAdvancedPermissions();
  const remoteEnabledPermissions = getRemoteEnabledAdvancedPermissions(source);

  if (remoteEnabledPermissions === undefined) {
    return [];
  }

  const remoteEnabledPermissionSet = new Set(remoteEnabledPermissions);

  return buildEnabledPermissions.filter((permissionType) =>
    remoteEnabledPermissionSet.has(permissionType),
  );
};
