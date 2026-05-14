import type { SupportedPermissionType } from '@metamask/gator-permissions-controller';
import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG,
  getEnabledAdvancedPermissions,
} from '../../../shared/lib/gator-permissions/feature-flags';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from '../../../shared/lib/selectors/remote-feature-flags';
import { captureMessage } from '../../../shared/lib/sentry';

const getEnabledAdvancedPermissionsFeatureFlag = (
  state: RemoteFeatureFlagsState,
) => getRemoteFeatureFlags(state)[ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG];

const isMalformedEnabledAdvancedPermissionsFeatureFlag = (flag: unknown) =>
  flag !== undefined &&
  (typeof flag !== 'object' ||
    flag === null ||
    !Array.isArray((flag as { permissions?: unknown }).permissions));

export const useEnabledAdvancedPermissions = (): SupportedPermissionType[] => {
  const enabledAdvancedPermissionsFeatureFlag = useSelector(
    getEnabledAdvancedPermissionsFeatureFlag,
  );
  const reportedMalformedRemoteFeatureFlagRef = useRef(false);

  useEffect(() => {
    if (
      reportedMalformedRemoteFeatureFlagRef.current ||
      !isMalformedEnabledAdvancedPermissionsFeatureFlag(
        enabledAdvancedPermissionsFeatureFlag,
      )
    ) {
      return;
    }

    reportedMalformedRemoteFeatureFlagRef.current = true;
    captureMessage('Invalid enabledAdvancedPermissions remote feature flag', {
      level: 'warning',
      extra: {
        featureFlag: ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG,
      },
    });
  }, [enabledAdvancedPermissionsFeatureFlag]);

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
