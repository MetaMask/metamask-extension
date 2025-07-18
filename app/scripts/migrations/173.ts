import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 173;

/**
 * This migration transitions the extension from using its own PreferencesController
 * to using the core @metamask/preferences-controller. The main change is flattening
 * the nested preferences structure - moving preferences from state.preferences.X to state.X
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>): void {
  if (!state.PreferencesController || typeof state.PreferencesController !== 'object') {
    console.warn('Migration 173: PreferencesController not found or not an object, skipping.');
    return;
  }

  const preferences = state.PreferencesController as Record<string, any>;

  // First, flatten the nested preferences object
  if (preferences.preferences && typeof preferences.preferences === 'object') {
    const nestedPrefs = preferences.preferences as Record<string, any>;

    // Move all nested preferences to the top level
    Object.entries(nestedPrefs).forEach(([key, value]) => {
      // Skip if the key already exists at the top level
      if (!(key in preferences)) {
        preferences[key] = value;
      }
    });

    // Remove the nested preferences object
    delete preferences.preferences;
  }

  // Ensure all required fields have proper defaults if they don't exist
  // Visual/UI Preferences
  if (!('useBlockie' in preferences)) preferences.useBlockie = false;
  if (!('theme' in preferences)) preferences.theme = 'dark';
  if (!('currentLocale' in preferences)) preferences.currentLocale = '';

  // Security/Privacy Preferences
  if (!('usePhishDetect' in preferences)) preferences.usePhishDetect = true;
  if (!('use4ByteResolution' in preferences)) preferences.use4ByteResolution = true;
  if (!('useCurrencyRateCheck' in preferences)) preferences.useCurrencyRateCheck = true;
  if (!('useExternalNameSources' in preferences)) preferences.useExternalNameSources = true;
  if (!('useExternalServices' in preferences)) preferences.useExternalServices = true;
  if (!('useAddressBarEnsResolution' in preferences)) preferences.useAddressBarEnsResolution = true;
  if (!('overrideContentSecurityPolicyHeader' in preferences)) preferences.overrideContentSecurityPolicyHeader = true;

  // Advanced Settings
  if (!('dismissSeedBackUpReminder' in preferences)) preferences.dismissSeedBackUpReminder = false;
  if (!('advancedGasFee' in preferences)) preferences.advancedGasFee = {};
  if (!('knownMethodData' in preferences)) preferences.knownMethodData = {};
  if (!('forgottenPassword' in preferences)) preferences.forgottenPassword = false;
  if (!('ledgerTransportType' in preferences)) {
    // Try to detect the best transport type
    preferences.ledgerTransportType = 'webhid';
  }
  if (!('enableMV3TimestampSave' in preferences)) preferences.enableMV3TimestampSave = true;

  // Feature Flags
  if (!('watchEthereumAccountEnabled' in preferences)) preferences.watchEthereumAccountEnabled = false;
  if (!('snapRegistryList' in preferences)) preferences.snapRegistryList = {};
  if (!('useMultiAccountBalanceChecker' in preferences)) preferences.useMultiAccountBalanceChecker = true;
  if (!('manageInstitutionalWallets' in preferences)) preferences.manageInstitutionalWallets = false;

  // User Experience Preferences (these were nested before)
  if (!('showExtensionInFullSizeView' in preferences)) preferences.showExtensionInFullSizeView = false;
  if (!('showFiatInTestnets' in preferences)) preferences.showFiatInTestnets = false;
  if (!('smartTransactionsMigrationApplied' in preferences)) preferences.smartTransactionsMigrationApplied = false;
  if (!('showNativeTokenAsMainBalance' in preferences)) preferences.showNativeTokenAsMainBalance = false;
  if (!('useNativeCurrencyAsPrimaryCurrency' in preferences)) preferences.useNativeCurrencyAsPrimaryCurrency = true;
  if (!('hideZeroBalanceTokens' in preferences)) preferences.hideZeroBalanceTokens = false;
  if (!('petnamesEnabled' in preferences)) preferences.petnamesEnabled = true;
  if (!('featureNotificationsEnabled' in preferences)) preferences.featureNotificationsEnabled = false;
  if (!('showConfirmationAdvancedDetails' in preferences)) preferences.showConfirmationAdvancedDetails = false;
  if (!('tokenNetworkFilter' in preferences)) preferences.tokenNetworkFilter = {};
  if (!('skipDeepLinkInterstitial' in preferences)) preferences.skipDeepLinkInterstitial = false;
  if (!('showMultiRpcModal' in preferences)) preferences.showMultiRpcModal = false;

  state.PreferencesController = preferences;
}