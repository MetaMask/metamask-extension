import { ENVIRONMENT } from '../constants/build';

/**
 * Get a boolean value for a string or boolean value.
 *
 * @param value - The value to convert to a boolean.
 * @returns `true` if the value is `'true'` or `true`, otherwise `false`.
 */
export function getBooleanFlag(value: string | boolean | undefined): boolean {
  return value === true || value === 'true';
}

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
 * Compile-time gate (`BFT_CONSOLIDATION_ENABLED`):
 * - Onboarding: assign new users to the consolidated experience (remote flags
 * are not reliable during onboarding).
 * - Existing BF-off wallets: hardcode consolidation + notice in this release,
 * because Basic Functionality off disables remote feature flag fetching.
 * BF-on existing users still use the remote flag as a kill switch.
 */
export const getIsBasicFunctionalityConsolidationEnabledInBuild =
  (): boolean => {
    return process.env.BFT_CONSOLIDATION_ENABLED?.toString() === 'true';
  };

export const getIsSettingsPageDevOptionsEnabled = (): boolean => {
  return process.env.ENABLE_SETTINGS_PAGE_DEV_OPTIONS?.toString() === 'true';
};

export const isGatorPermissionsRevocationFeatureEnabled = (): boolean => {
  return (
    process.env.GATOR_PERMISSIONS_REVOCATION_ENABLED?.toString() === 'true'
  );
};

/**
 * Compile-time gate (`QR_SYNC_ENABLED`): when true the
 * Add Device tab is shown in Settings, allowing users to pair a second device
 * via QR code scan and verification code.
 */
export const getIsQrSyncEnabled = (): boolean => {
  return process.env.QR_SYNC_ENABLED?.toString() === 'true';
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
