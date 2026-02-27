import { getBooleanFlag } from '../lib/common-utils';
import { SupportedPermissionType } from '@metamask/gator-permissions-controller';
import { ENVIRONMENT } from '../../development/build/constants';

export const isProduction = (): boolean => {
  return (
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.DEVELOPMENT &&
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.TESTING
  );
};

export const getIsSeedlessOnboardingFeatureEnabled = (): boolean => {
  return getBooleanFlag(process.env.SEEDLESS_ONBOARDING_ENABLED);
};

export const getIsMetaMaskShieldFeatureEnabled = (): boolean => {
  return getBooleanFlag(process.env.METAMASK_SHIELD_ENABLED);
};

export const getIsSettingsPageDevOptionsEnabled = (): boolean => {
  return getBooleanFlag(process.env.ENABLE_SETTINGS_PAGE_DEV_OPTIONS);
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
  return getBooleanFlag(process.env.GATOR_PERMISSIONS_REVOCATION_ENABLED);
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

export const getIsForcePreinstalledSnapsEnabled = (): boolean => {
  return getBooleanFlag(process.env.FORCE_PREINSTALLED_SNAPS);
};
