import type { SupportedPermissionType } from '@metamask/gator-permissions-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG,
  getEnabledAdvancedPermissions,
} from '../../../shared/lib/gator-permissions/feature-flags';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from '../../../shared/lib/selectors/remote-feature-flags';

const getEnabledAdvancedPermissionsFeatureFlag = (
  state: RemoteFeatureFlagsState,
) => getRemoteFeatureFlags(state)[ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG];

export const useEnabledAdvancedPermissions = (): SupportedPermissionType[] => {
  const enabledAdvancedPermissionsFeatureFlag = useSelector(
    getEnabledAdvancedPermissionsFeatureFlag,
  );

  return useMemo(
    () =>
      getEnabledAdvancedPermissions({
        remoteFeatureFlags: {
          [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]:
            enabledAdvancedPermissionsFeatureFlag,
        },
      }),
    [enabledAdvancedPermissionsFeatureFlag],
  );
};
