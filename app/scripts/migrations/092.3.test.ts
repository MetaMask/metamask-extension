import { migrate } from './092.3';

const PREFERENCES_CONTROLLER_MOCK = {
  useBlockie: false,
  useNonceField: false,
  usePhishDetect: true,
  dismissSeedBackUpReminder: false,
  disabledRpcMethodPreferences: {
    eth_sign: false,
  },
  useMultiAccountBalanceChecker: true,
  useTokenDetection: false,
  useNftDetection: false,
  use4ByteResolution: true,
  useCurrencyRateCheck: true,
  openSeaEnabled: false,
  advancedGasFee: null,
  featureFlags: {
    showIncomingTransactions: true,
  },
  knownMethodData: {},
  currentLocale: 'EN',
  identities: {},
  lostIdentities: {},
  forgottenPassword: false,
  preferences: {
    autoLockTimeLimit: undefined,
    showFiatInTestnets: false,
    showTestNetworks: false,
    useNativeCurrencyAsPrimaryCurrency: true,
    hideZeroBalanceTokens: false,
  },
  // ENS decentralized website resolution
  ipfsGateway: '',
  useAddressBarEnsResolution: true,
  infuraBlocked: null,
  ledgerTransportType: 'U2F',
  snapRegistryList: {},
  transactionSecurityCheckEnabled: false,
  theme: 'OS',
  isLineaMainnetReleased: false,
};

const PREFERENCES_CONTROLLER_MOCK_2 = {
  ...PREFERENCES_CONTROLLER_MOCK,
  advancedGasFee: {
    priorityFee: '0x1',
    maxBaseFee: '0x1',
  },
};

describe('migration #92.3', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 92.2 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: 92.3 });
  });

  it('does nothing if no PreferencesController state', async () => {
    const oldData = {
      some: 'data',
    };

    const oldStorage = {
      meta: { version: 92.2 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('changes advancedGasFee from null to an empty object, and sets hadAdvancedGasFeesSetPriorToMigration92_3 to false', async () => {
    const oldData = {
      some: 'data',
      PreferencesController: {
        ...PREFERENCES_CONTROLLER_MOCK,
      },
    };

    const oldStorage = {
      meta: { version: 92.2 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      some: oldData.some,
      PreferencesController: {
        ...PREFERENCES_CONTROLLER_MOCK,
        advancedGasFee: {},
      },
      AppStateController: {
        hadAdvancedGasFeesSetPriorToMigration92_3: false,
      },
    });
  });

  it('changes advancedGasFee from an object of values to an empty object and sets hadAdvancedGasFeesSetPriorToMigration92_3 to true', async () => {
    const oldData = {
      some: 'data',
      PreferencesController: {
        ...PREFERENCES_CONTROLLER_MOCK_2,
      },
    };

    const oldStorage = {
      meta: { version: 92.2 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      some: oldData.some,
      PreferencesController: {
        ...PREFERENCES_CONTROLLER_MOCK_2,
        advancedGasFee: {},
      },
      AppStateController: {
        hadAdvancedGasFeesSetPriorToMigration92_3: true,
      },
    });
  });
});
