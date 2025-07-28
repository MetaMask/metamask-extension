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

  console.log('Migration 173: PreferencesController found, transforming state...');

  const oldPreferences = state.PreferencesController as Record<string, any>;

  // Start with a copy of the existing preferences controller state
  // This preserves all existing top-level properties like ipfsGateway, useTokenDetection, etc.
  const newPreferences = { ...oldPreferences };

  // If there's a nested preferences object, flatten it
  if (oldPreferences.preferences && typeof oldPreferences.preferences === 'object') {
    const nestedPrefs = oldPreferences.preferences as Record<string, any>;

    // Move all nested preferences to the top level
    Object.entries(nestedPrefs).forEach(([key, value]) => {
      // Only move if the key doesn't already exist at the top level
      // This ensures we don't override existing top-level values
      if (!(key in newPreferences)) {
        newPreferences[key] = value;
      }
    });

    // Remove the nested preferences object
    delete newPreferences.preferences;
  }

  // Add default values ONLY for properties that don't exist
  // These match the defaults in core PreferencesController
  const defaults: Record<string, any> = {
    // Visual/UI Preferences
    useBlockie: false,
    theme: 'dark',
    currentLocale: '',
    textDirection: undefined,

    // Security/Privacy Preferences
    usePhishDetect: true,
    use4ByteResolution: true,
    useCurrencyRateCheck: true,
    useExternalNameSources: true,
    useExternalServices: true,
    useAddressBarEnsResolution: true,
    overrideContentSecurityPolicyHeader: true,
    securityAlertsEnabled: true,
    useSafeChainsListValidation: true,

    // Token/NFT Detection
    useTokenDetection: true,
    openSeaEnabled: true,
    useNftDetection: false,

    // Advanced Settings
    dismissSeedBackUpReminder: false,
    advancedGasFee: {},
    knownMethodData: {},
    forgottenPassword: false,
    ledgerTransportType: 'webhid',
    enableMV3TimestampSave: true,

    // Feature Flags
    watchEthereumAccountEnabled: false,
    addSnapAccountEnabled: false,
    snapRegistryList: {},
    snapsAddSnapAccountModalDismissed: false,
    useMultiAccountBalanceChecker: true,
    manageInstitutionalWallets: false,
    useMultiRpcMigration: true,
    useTransactionSimulations: true,

    // User Experience Preferences
    autoLockTimeLimit: undefined,
    showExtensionInFullSizeView: false,
    showFiatInTestnets: false,
    showTestNetworks: false,
    smartTransactionsOptInStatus: true,
    smartTransactionsMigrationApplied: false,
    showNativeTokenAsMainBalance: false,
    useNativeCurrencyAsPrimaryCurrency: true,
    hideZeroBalanceTokens: false,
    petnamesEnabled: true,
    featureNotificationsEnabled: false,
    showConfirmationAdvancedDetails: false,
    tokenNetworkFilter: {},
    tokenSortConfig: {
      key: 'tokenFiatAmount',
      order: 'dsc',
      sortCallback: 'stringNumeric',
    },
    skipDeepLinkInterstitial: false,
    showMultiRpcModal: false,
    privacyMode: false,
    dismissSmartAccountSuggestionEnabled: false,
    smartAccountOptIn: true,
    smartAccountOptInForAccounts: [],
  };

  // Apply defaults only for missing properties
  Object.entries(defaults).forEach(([key, value]) => {
    if (!(key in newPreferences)) {
      newPreferences[key] = value;
    }
  });

  console.log('Migration 173: New preferences:', newPreferences);

  // Replace the state with the transformed preferences
  state.PreferencesController = newPreferences;
}