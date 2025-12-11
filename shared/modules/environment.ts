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

export const isGatorPermissionsFeatureEnabled = (): boolean => {
  return process.env.GATOR_PERMISSIONS_ENABLED?.toString() === 'true';
};

export const isGatorPermissionsRevocationFeatureEnabled = (): boolean => {
  return (
    process.env.GATOR_PERMISSIONS_REVOCATION_ENABLED?.toString() === 'true'
  );
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
