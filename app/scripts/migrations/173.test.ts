import { migrate, version } from './173';

describe('migration #173', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: { version: 172 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('should preserve existing top-level preferences like ipfsGateway', async () => {
    const oldStorage = {
      meta: { version: 172 },
      data: {
        PreferencesController: {
          ipfsGateway: 'custom.gateway.com',
          isIpfsGatewayEnabled: false,
          useTokenDetection: true,
          openSeaEnabled: false,
          securityAlertsEnabled: true,
          useSafeChainsListValidation: false,
          selectedAddress: '0x123',
          identities: { '0x123': { name: 'Account 1' } },
          lostIdentities: {},
          preferences: {
            autoLockTimeLimit: 300,
            showFiatInTestnets: true,
            privacyMode: true,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.PreferencesController).toMatchObject({
      // Existing top-level properties should be preserved
      ipfsGateway: 'custom.gateway.com',
      isIpfsGatewayEnabled: false,
      useTokenDetection: true,
      openSeaEnabled: false,
      securityAlertsEnabled: true,
      useSafeChainsListValidation: false,
      selectedAddress: '0x123',
      identities: { '0x123': { name: 'Account 1' } },
      lostIdentities: {},
      // Nested preferences should be flattened
      autoLockTimeLimit: 300,
      showFiatInTestnets: true,
      privacyMode: true,
      // New defaults should be added
      useBlockie: false,
      theme: 'dark',
      currentLocale: '',
      textDirection: undefined,
      usePhishDetect: true,
      dismissSeedBackUpReminder: false,
      advancedGasFee: {},
      knownMethodData: {},
      forgottenPassword: false,
      ledgerTransportType: 'webhid',
      enableMV3TimestampSave: true,
      watchEthereumAccountEnabled: false,
      addSnapAccountEnabled: false,
      snapRegistryList: {},
      snapsAddSnapAccountModalDismissed: false,
      useMultiAccountBalanceChecker: true,
      showExtensionInFullSizeView: false,
      smartTransactionsMigrationApplied: false,
      showNativeTokenAsMainBalance: false,
      useNativeCurrencyAsPrimaryCurrency: true,
      hideZeroBalanceTokens: false,
      petnamesEnabled: true,
      featureNotificationsEnabled: false,
      showConfirmationAdvancedDetails: false,
      tokenNetworkFilter: {},
      skipDeepLinkInterstitial: false,
      showMultiRpcModal: false,
      manageInstitutionalWallets: false,
      use4ByteResolution: true,
      useCurrencyRateCheck: true,
      useExternalNameSources: true,
      useExternalServices: true,
      useAddressBarEnsResolution: true,
      overrideContentSecurityPolicyHeader: true,
    });

    // The nested preferences object should be removed
    expect(newStorage.data.PreferencesController).not.toHaveProperty('preferences');
  });

  it('should handle when PreferencesController is missing', async () => {
    const oldStorage = {
      meta: { version: 172 },
      data: {
        OtherController: {},
      },
    };

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const newStorage = await migrate(oldStorage);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Migration 173: PreferencesController not found or not an object, skipping.'
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);

    consoleSpy.mockRestore();
  });

  it('should handle when PreferencesController has no nested preferences object', async () => {
    const oldStorage = {
      meta: { version: 172 },
      data: {
        PreferencesController: {
          ipfsGateway: 'dweb.link',
          isIpfsGatewayEnabled: true,
          selectedAddress: '0x456',
          identities: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.PreferencesController).toMatchObject({
      // Existing properties preserved
      ipfsGateway: 'dweb.link',
      isIpfsGatewayEnabled: true,
      selectedAddress: '0x456',
      identities: {},
      // Defaults added
      autoLockTimeLimit: undefined,
      showFiatInTestnets: false,
      showExtensionInFullSizeView: false,
      useBlockie: false,
      theme: 'dark',
    });
  });

  it('should not override existing top-level values when flattening nested preferences', async () => {
    const oldStorage = {
      meta: { version: 172 },
      data: {
        PreferencesController: {
          autoLockTimeLimit: 600, // Existing top-level value
          showFiatInTestnets: false, // Existing top-level value
          preferences: {
            autoLockTimeLimit: 300, // Nested value should NOT override
            showFiatInTestnets: true, // Nested value should NOT override
            privacyMode: true, // This should be moved up
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data.PreferencesController).toMatchObject({
      // Top-level values should be preserved, not overridden by nested values
      autoLockTimeLimit: 600,
      showFiatInTestnets: false,
      // Only non-conflicting nested values should be moved up
      privacyMode: true,
    });
  });

  it('should add all required default values for new properties', async () => {
    const oldStorage = {
      meta: { version: 172 },
      data: {
        PreferencesController: {},
      },
    };

    const newStorage = await migrate(oldStorage);
    const prefs = newStorage.data.PreferencesController;

    // Check all defaults are added
    expect(prefs).toMatchObject({
      useBlockie: false,
      theme: 'dark',
      currentLocale: '',
      textDirection: undefined,
      usePhishDetect: true,
      use4ByteResolution: true,
      useCurrencyRateCheck: true,
      useExternalNameSources: true,
      useExternalServices: true,
      useAddressBarEnsResolution: true,
      overrideContentSecurityPolicyHeader: true,
      securityAlertsEnabled: true,
      useSafeChainsListValidation: true,
      useTokenDetection: true,
      openSeaEnabled: true,
      useNftDetection: false,
      dismissSeedBackUpReminder: false,
      advancedGasFee: {},
      knownMethodData: {},
      forgottenPassword: false,
      ledgerTransportType: 'webhid',
      enableMV3TimestampSave: true,
      watchEthereumAccountEnabled: false,
      addSnapAccountEnabled: false,
      snapRegistryList: {},
      snapsAddSnapAccountModalDismissed: false,
      useMultiAccountBalanceChecker: true,
      manageInstitutionalWallets: false,
      useMultiRpcMigration: true,
      useTransactionSimulations: true,
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
    });
  });
});