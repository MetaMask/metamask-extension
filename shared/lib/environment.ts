import type { SupportedPermissionType } from '@metamask/gator-permissions-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { ENVIRONMENT } from '../../development/build/constants';

export const isProduction = (): boolean => {
  return (
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.DEVELOPMENT &&
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.TESTING
  );
};

export const getIsSeedlessOnboardingFeatureEnabled = (): boolean => {
  return process.env.SEEDLESS_ONBOARDING_ENABLED?.toString() === 'true';
};

export const getIsMetaMaskShieldFeatureEnabled = (): boolean => {
  return process.env.METAMASK_SHIELD_ENABLED?.toString() === 'true';
};

/**
 * Compile-time gate (`PERPS_ENABLED`): this extension binary includes PerpsController and
 * related background paths. Distinct from remote `perpsEnabledVersion` rollout (see
 * `isPerpsRemoteConfigSatisfied` and `getIsPerpsExperienceAvailable`).
 */
export const getIsPerpsIncludedInBuild = (): boolean => {
  return process.env.PERPS_ENABLED?.toString() === 'true';
};

/**
 * Compile-time gate (`ASSETS_UNIFIED_STATE_ENABLED`): controls whether
 * AssetsController populates state. The controller is always instantiated,
 * but when this is false the state remains empty. Distinct from the remote
 * `assetsUnifyState` rollout flag which provides an additional runtime gate.
 */
export const getIsAssetsUnifiedStateIncludedInBuild = (): boolean => {
  return process.env.ASSETS_UNIFIED_STATE_ENABLED?.toString() === 'true';
};

export const getIsSettingsPageDevOptionsEnabled = (): boolean => {
  return process.env.ENABLE_SETTINGS_PAGE_DEV_OPTIONS?.toString() === 'true';
};

export const ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG =
  'enabled-advanced-permissions';

type AdvancedPermissionsFeatureFlag = {
  permissions?: unknown;
};

type AdvancedPermissionsFeatureFlagSource = Pick<
  RemoteFeatureFlagControllerState,
  'remoteFeatureFlags'
>;

const IMPLEMENTED_ADVANCED_PERMISSION_TYPES: SupportedPermissionType[] = [
  'native-token-stream',
  'native-token-periodic',
  'erc20-token-stream',
  'erc20-token-periodic',
  'erc20-token-revocation',
];

const isImplementedAdvancedPermissionType = (
  permissionType: unknown,
): permissionType is SupportedPermissionType =>
  typeof permissionType === 'string' &&
  IMPLEMENTED_ADVANCED_PERMISSION_TYPES.includes(
    permissionType as SupportedPermissionType,
  );

const getBuildEnabledAdvancedPermissions = (): SupportedPermissionType[] => {
  const enabled =
    process.env.GATOR_ENABLED_PERMISSION_TYPES?.toString().trim() || '';

  return enabled
    .split(',')
    .map((permissionType) => permissionType.trim())
    .filter(isImplementedAdvancedPermissionType);
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

  return flag.permissions.filter(isImplementedAdvancedPermissionType);
};

/**
 * Returns the enabled Gator permission types for the current runtime.
 *
 * When present, the `enabled-advanced-permissions` remote flag is the runtime
 * source of truth so permission types can be changed after distribution. Values
 * for permission types not implemented in the extension are ignored.
 * `GATOR_ENABLED_PERMISSION_TYPES` remains the fallback for builds without the
 * remote flag loaded.
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
    return buildEnabledPermissions;
  }

  return remoteEnabledPermissions;
};

export const isGatorPermissionsRevocationFeatureEnabled = (): boolean => {
  return (
    process.env.GATOR_PERMISSIONS_REVOCATION_ENABLED?.toString() === 'true'
  );
};

/**
 * Compile-time gate (`NEW_HARDWARE_WALLET_ONBOARDING`): when true the
 * extension uses the redesigned hardware-wallet onboarding flows (device
 * discovery and error handling).
 */
export const getIsNewHardwareWalletOnboardingEnabled = (): boolean => {
  return process.env.NEW_HARDWARE_WALLET_ONBOARDING?.toString() === 'true';
};

export const getIsSidePanelFeatureEnabled = (): boolean => {
  // In browser context, check if the API exists (Firefox doesn't have it)
  if (
    typeof window !== 'undefined' &&
    typeof chrome !== 'undefined' &&
    !chrome.sidePanel
  ) {
    return false;
  }

  // Arc browser doesn't support sidepanel properly.
  // Arc uses a Chrome-identical user agent, so we detect it via its unique CSS variable.
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const arcPaletteTitle = getComputedStyle(
        document.documentElement,
      ).getPropertyValue('--arc-palette-title');
      if (arcPaletteTitle) {
        return false;
      }
    } catch (error) {
      console.warn('Arc browser detection failed:', error);
    }
  }

  return true;
};

export const getIsPasskeyFeatureEnabled = (): boolean => {
  return process.env.PASSKEY_ENABLED?.toString() === 'true';
};
