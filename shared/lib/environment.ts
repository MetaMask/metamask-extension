import { ENVIRONMENT } from '../constants/build';

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

/**
 * Compile-time gate (`BFT_CONSOLIDATION_ENABLED`): controls whether onboarding
 * assigns new users to the consolidated Basic Functionality experience. This
 * is intentionally separate from the remote rollout flag because onboarding
 * completes before remote feature flags are reliably available.
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
export const getIsAddDeviceSyncEnabled = (): boolean => {
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
