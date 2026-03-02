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
export const getEnabledAdvancedPermissions = (): string[] => {
  const enabled =
    process.env.GATOR_ENABLED_PERMISSION_TYPES?.toString().trim() || '';
  return enabled.split(',').filter(Boolean);
};

export const isGatorPermissionsRevocationFeatureEnabled = (): boolean => {
  return (
    process.env.GATOR_PERMISSIONS_REVOCATION_ENABLED?.toString() === 'true'
  );
};

/**
 * Returns the MFA Cloud Signer URL for MPC account operations.
 *
 * @returns The cloud signer URL, or undefined if not set.
 */
export const getMfaCloudSignerUrl = (): string | undefined => {
  return process.env.MFA_CLOUD_SIGNER_URL ?? undefined;
};

/**
 * Returns the MFA Relayer URL for MPC account operations.
 *
 * @returns The relayer URL, or undefined if not set.
 */
export const getMfaRelayerUrl = (): string | undefined => {
  return process.env.MFA_RELAYER_URL ?? undefined;
};

export const getIsSidePanelFeatureEnabled = (): boolean => {
  // First check if build supports sidepanel
  if (process.env.IS_SIDEPANEL?.toString() !== 'true') {
    return false;
  }

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
