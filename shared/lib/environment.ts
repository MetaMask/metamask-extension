import { SupportedPermissionType } from '@metamask/gator-permissions-controller';
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

/**
 * Returns the list of enabled Gator permission types from the environment configuration.
 * These permission types control which advanced permissions (e.g., token streams,
 * periodic transfers) are available in the current build.
 *
 * @returns An array of enabled permission type strings (e.g., 'native-token-stream',
 * 'erc20-token-periodic'), or an empty array if none are configured.
 */
export const getEnabledAdvancedPermissions = (): SupportedPermissionType[] => {
  const enabled =
    process.env.GATOR_ENABLED_PERMISSION_TYPES?.toString().trim() || '';

  return enabled.split(',').filter(Boolean) as SupportedPermissionType[];
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
