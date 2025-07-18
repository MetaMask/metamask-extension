import { migrate, version } from './173';

describe(`migration #${version}`, () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('should flatten nested preferences structure', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        PreferencesController: {
          selectedAddress: '0x123',
          identities: {},
          preferences: {
            autoLockTimeLimit: 5,
            showExtensionInFullSizeView: true,
            showFiatInTestnets: true,
            smartTransactionsOptInStatus: false,
            hideZeroBalanceTokens: true,
            tokenSortConfig: {
              key: 'tokenFiatAmount',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
          },
          useBlockie: true,
          theme: 'light',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    const prefs = newStorage.data.PreferencesController as Record<string, any>;

    // Check that nested preferences were moved to top level
    expect(prefs.autoLockTimeLimit).toBe(5);
    expect(prefs.showExtensionInFullSizeView).toBe(true);
    expect(prefs.showFiatInTestnets).toBe(true);
    expect(prefs.smartTransactionsOptInStatus).toBe(false);
    expect(prefs.hideZeroBalanceTokens).toBe(true);
    expect(prefs.tokenSortConfig).toStrictEqual({
      key: 'tokenFiatAmount',
      order: 'dsc',
      sortCallback: 'stringNumeric',
    });

    // Check that the nested preferences object was removed
    expect(prefs.preferences).toBeUndefined();

    // Check that existing top-level preferences were preserved
    expect(prefs.selectedAddress).toBe('0x123');
    expect(prefs.identities).toStrictEqual({});
    expect(prefs.useBlockie).toBe(true);
    expect(prefs.theme).toBe('light');
  });

  it('should add default values for new preferences', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        PreferencesController: {
          selectedAddress: '0x123',
          identities: {},
          preferences: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    const prefs = newStorage.data.PreferencesController as Record<string, any>;

    // Check that new preferences have default values
    expect(prefs.usePhishDetect).toBe(true);
    expect(prefs.use4ByteResolution).toBe(true);
    expect(prefs.useCurrencyRateCheck).toBe(true);
    expect(prefs.useExternalNameSources).toBe(true);
    expect(prefs.useExternalServices).toBe(true);
    expect(prefs.watchEthereumAccountEnabled).toBe(false);
    expect(prefs.useMultiAccountBalanceChecker).toBe(true);
    expect(prefs.manageInstitutionalWallets).toBe(false);
    expect(prefs.ledgerTransportType).toBe('webhid');
  });

  it('should handle missing PreferencesController', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        OtherController: {},
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      OtherController: {},
    });
  });

  it('should not override existing top-level preferences with nested ones', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        PreferencesController: {
          // Top-level autoLockTimeLimit should take precedence
          autoLockTimeLimit: 10,
          preferences: {
            // This nested one should be ignored
            autoLockTimeLimit: 5,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    const prefs = newStorage.data.PreferencesController as Record<string, any>;
    expect(prefs.autoLockTimeLimit).toBe(10);
  });
});