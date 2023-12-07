const {
  WALLET_SNAP_PERMISSION_KEY,
  SnapCaveatType,
} = require('@metamask/snaps-utils');
const { merge } = require('lodash');
const { toHex } = require('@metamask/controller-utils');
const { NetworkStatus } = require('@metamask/network-controller');
const { CHAIN_IDS, NETWORK_TYPES } = require('../../shared/constants/network');
const { SMART_CONTRACTS } = require('./seeder/smart-contracts');
const { DAPP_URL, DAPP_ONE_URL } = require('./helpers');

function defaultFixture() {
  return {
    data: {
      AccountsController: {
        internalAccounts: {
          selectedAccount: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
          accounts: {
            'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
              id: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
              address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              metadata: {
                name: 'Account 1',
                lastSelected: 1665507600000,
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: [
                'personal_sign',
                'eth_sign',
                'eth_signTransaction',
                'eth_signTypedData_v1',
                'eth_signTypedData_v3',
                'eth_signTypedData_v4',
              ],
              type: 'eip155:eoa',
            },
          },
        },
      },
      AlertController: {
        alertEnabledness: {
          unconnectedAccount: true,
          web3ShimUsage: true,
        },
        unconnectedAccountAlertShownOrigins: {},
        web3ShimUsageOrigins: {},
      },
      AnnouncementController: {
        announcements: {
          1: {
            date: '2021-03-17',
            id: 1,
            image: {
              height: '230px',
              placeImageBelowDescription: true,
              src: 'images/mobile-link-qr.svg',
              width: '230px',
            },
            isShown: false,
          },
          3: {
            date: '2021-03-08',
            id: 3,
            isShown: false,
          },
          4: {
            date: '2021-05-11',
            id: 4,
            image: {
              src: 'images/source-logos-bsc.svg',
              width: '100%',
            },
            isShown: false,
          },
          5: {
            date: '2021-06-09',
            id: 5,
            isShown: false,
          },
          6: {
            date: '2021-05-26',
            id: 6,
            isShown: false,
          },
          7: {
            date: '2021-09-17',
            id: 7,
            isShown: false,
          },
          8: {
            date: '2021-11-01',
            id: 8,
            isShown: false,
          },
          9: {
            date: '2021-12-07',
            id: 9,
            image: {
              src: 'images/txinsights.png',
              width: '80%',
            },
            isShown: false,
          },
          10: {
            date: '2022-09-15',
            id: 10,
            image: {
              src: 'images/token-detection.svg',
              width: '100%',
            },
            isShown: false,
          },
          11: {
            date: '2022-09-15',
            id: 11,
            isShown: false,
          },
          12: {
            date: '2022-05-18',
            id: 12,
            image: {
              src: 'images/darkmode-banner.png',
              width: '100%',
            },
            isShown: false,
          },
          13: {
            date: '2022-09-15',
            id: 13,
            isShown: false,
          },
          14: {
            date: '2022-09-15',
            id: 14,
            isShown: false,
          },
          15: {
            date: '2022-09-15',
            id: 15,
            isShown: false,
          },
          16: {
            date: null,
            id: 16,
            isShown: false,
          },
          17: {
            date: null,
            id: 17,
            isShown: false,
          },
          18: {
            date: null,
            id: 18,
            isShown: true,
          },
          19: {
            date: null,
            id: 19,
            isShown: true,
          },
          21: {
            date: null,
            id: 21,
            isShown: true,
          },
          22: {
            date: null,
            id: 22,
            isShown: true,
          },
          ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
          23: {
            date: null,
            id: 23,
            isShown: false,
          },
          ///: END:ONLY_INCLUDE_IF
        },
      },
      NetworkOrderController: {
        orderedNetworkList: [],
      },
      AppStateController: {
        browserEnvironment: {},
        nftsDropdownState: {},
        connectedStatusPopoverHasBeenShown: true,
        termsOfUseLastAgreed:
          '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds',
        defaultHomeActiveTabName: null,
        fullScreenGasPollTokens: [],
        notificationGasPollTokens: [],
        popupGasPollTokens: [],
        qrHardware: {},
        recoveryPhraseReminderHasBeenShown: true,
        recoveryPhraseReminderLastShown:
          '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds',
        showTestnetMessageInDropdown: true,
        trezorModel: null,
        usedNetworks: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.LINEA_MAINNET]: true,
          [CHAIN_IDS.GOERLI]: true,
          [CHAIN_IDS.LOCALHOST]: true,
        },
        snapsInstallPrivacyWarningShown: true,
      },
      CachedBalancesController: {
        cachedBalances: {
          [CHAIN_IDS.LOCALHOST]: {},
        },
      },
      CurrencyController: {
        currentCurrency: 'usd',
        currencyRates: {
          ETH: {
            conversionDate: 1665507600.0,
            conversionRate: 1300.0,
            usdConversionRate: 1300.0,
          },
        },
      },
      GasFeeController: {
        estimatedGasFeeTimeBounds: {},
        gasEstimateType: 'none',
        gasFeeEstimates: {},
      },
      KeyringController: {
        vault:
          '{"data":"s6TpYjlUNsn7ifhEFTkuDGBUM1GyOlPrim7JSjtfIxgTt8/6MiXgiR/CtFfR4dWW2xhq85/NGIBYEeWrZThGdKGarBzeIqBfLFhw9n509jprzJ0zc2Rf+9HVFGLw+xxC4xPxgCS0IIWeAJQ+XtGcHmn0UZXriXm8Ja4kdlow6SWinB7sr/WM3R0+frYs4WgllkwggDf2/Tv6VHygvLnhtzp6hIJFyTjh+l/KnyJTyZW1TkZhDaNDzX3SCOHT","iv":"FbeHDAW5afeWNORfNJBR0Q==","salt":"TxZ+WbCW6891C9LK/hbMAoUsSEW1E8pyGLVBU6x5KR8="}',
      },
      MetaMetricsController: {
        eventsBeforeMetricsOptIn: [],
        fragments: {},
        metaMetricsId: null,
        participateInMetaMetrics: false,
        traits: {},
      },
      NetworkController: {
        selectedNetworkClientId: 'networkConfigurationId',
        networksMetadata: {
          networkConfigurationId: {
            EIPS: {},
            status: NetworkStatus.Available,
          },
        },
        providerConfig: {
          chainId: CHAIN_IDS.LOCALHOST,
          nickname: 'Localhost 8545',
          rpcPrefs: {},
          rpcUrl: 'http://localhost:8545',
          ticker: 'ETH',
          type: 'rpc',
          id: 'networkConfigurationId',
        },
        networkConfigurations: {
          networkConfigurationId: {
            chainId: CHAIN_IDS.LOCALHOST,
            nickname: 'Localhost 8545',
            rpcPrefs: {},
            rpcUrl: 'http://localhost:8545',
            ticker: 'ETH',
            networkConfigurationId: 'networkConfigurationId',
          },
        },
      },
      OnboardingController: {
        completedOnboarding: true,
        firstTimeFlowType: 'import',
        onboardingTabs: {},
        seedPhraseBackedUp: true,
      },
      PermissionController: {
        subjects: {},
      },
      PreferencesController: {
        advancedGasFee: null,
        currentLocale: 'en',
        dismissSeedBackUpReminder: true,
        featureFlags: {},
        forgottenPassword: false,
        identities: {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
            address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            lastSelected: 1665507600000,
            name: 'Account 1',
          },
        },
        ipfsGateway: 'dweb.link',
        knownMethodData: {},
        ledgerTransportType: 'webhid',
        lostIdentities: {},
        openSeaEnabled: false,
        preferences: {
          hideZeroBalanceTokens: false,
          showFiatInTestnets: false,
          showTestNetworks: false,
          useNativeCurrencyAsPrimaryCurrency: true,
        },
        selectedAddress: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        theme: 'light',
        useBlockie: false,
        useNftDetection: false,
        useNonceField: false,
        usePhishDetect: true,
        useTokenDetection: false,
        useCurrencyRateCheck: true,
        useMultiAccountBalanceChecker: true,
        useRequestQueue: false,
      },
      SmartTransactionsController: {
        smartTransactionsState: {
          fees: {},
          liveness: true,
          smartTransactions: {
            [CHAIN_IDS.MAINNET]: [],
          },
        },
      },
      SubjectMetadataController: {
        subjectMetadata: {
          'https://metamask.github.io': {
            extensionId: null,
            iconUrl: null,
            name: 'MetaMask < = > Ledger Bridge',
            origin: 'https://metamask.github.io',
            subjectType: 'website',
          },
        },
      },
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
        detectedTokens: [],
        ignoredTokens: [],
        tokens: [],
      },
      TransactionController: {
        transactions: {},
      },
      config: {},
      firstTimeInfo: {
        date: 1665507600000,
        version: '10.21.0',
      },
    },
  };
}

function onboardingFixture() {
  return {
    data: {
      AppStateController: {
        browserEnvironment: {},
        nftsDropdownState: {},
        connectedStatusPopoverHasBeenShown: true,
        defaultHomeActiveTabName: null,
        fullScreenGasPollTokens: [],
        notificationGasPollTokens: [],
        popupGasPollTokens: [],
        qrHardware: {},
        recoveryPhraseReminderHasBeenShown: false,
        recoveryPhraseReminderLastShown:
          '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds',
        showTestnetMessageInDropdown: true,
        trezorModel: null,
        usedNetworks: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.LINEA_MAINNET]: true,
          [CHAIN_IDS.GOERLI]: true,
          [CHAIN_IDS.LOCALHOST]: true,
        },
      },
      NetworkController: {
        selectedNetworkClientId: 'networkConfigurationId',
        networksMetadata: {
          networkConfigurationId: {
            EIPS: {},
            status: NetworkStatus.Available,
          },
        },
        providerConfig: {
          ticker: 'ETH',
          type: 'rpc',
          rpcUrl: 'http://localhost:8545',
          chainId: CHAIN_IDS.LOCALHOST,
          nickname: 'Localhost 8545',
          id: 'networkConfigurationId',
        },
        networkConfigurations: {
          networkConfigurationId: {
            chainId: CHAIN_IDS.LOCALHOST,
            nickname: 'Localhost 8545',
            rpcPrefs: {},
            rpcUrl: 'http://localhost:8545',
            ticker: 'ETH',
            networkConfigurationId: 'networkConfigurationId',
            type: 'rpc',
          },
        },
      },
      PreferencesController: {
        advancedGasFee: null,
        currentLocale: 'en',
        dismissSeedBackUpReminder: false,
        featureFlags: {},
        forgottenPassword: false,
        identities: {},
        ipfsGateway: 'dweb.linkssssss',
        knownMethodData: {},
        ledgerTransportType: 'webhid',
        lostIdentities: {},
        openSeaEnabled: false,
        preferences: {
          hideZeroBalanceTokens: false,
          showFiatInTestnets: false,
          showTestNetworks: false,
          useNativeCurrencyAsPrimaryCurrency: true,
        },
        theme: 'light',
        useBlockie: false,
        useNftDetection: false,
        useNonceField: false,
        usePhishDetect: true,
        useTokenDetection: false,
        useCurrencyRateCheck: true,
        useMultiAccountBalanceChecker: true,
        useRequestQueue: false,
      },
      SmartTransactionsController: {
        smartTransactionsState: {
          fees: {},
          liveness: true,
          smartTransactions: {
            [CHAIN_IDS.MAINNET]: [],
          },
        },
      },
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
        detectedTokens: [],
        ignoredTokens: [],
        tokens: [],
      },
      config: {},
      firstTimeInfo: {
        date: 1665507600000,
        version: '10.21.0',
      },
    },
  };
}

class FixtureBuilder {
  constructor({ onboarding = false } = {}) {
    this.fixture = onboarding === true ? onboardingFixture() : defaultFixture();
  }

  withAddressBookController(data) {
    merge(
      this.fixture.data.AddressBookController
        ? this.fixture.data.AddressBookController
        : (this.fixture.data.AddressBookController = {}),
      data,
    );
    return this;
  }

  withAlertController(data) {
    merge(this.fixture.data.AlertController, data);
    return this;
  }

  withAnnouncementController(data) {
    merge(this.fixture.data.AnnouncementController, data);
    return this;
  }

  withNetworkOrderController(data) {
    merge(this.fixture.data.NetworkOrderController, data);
    return this;
  }

  withAppStateController(data) {
    merge(this.fixture.data.AppStateController, data);
    return this;
  }

  withCachedBalancesController(data) {
    merge(this.fixture.data.CachedBalancesController, data);
    return this;
  }

  withCurrencyController(data) {
    merge(this.fixture.data.CurrencyController, data);
    return this;
  }

  withGasFeeController(data) {
    merge(this.fixture.data.GasFeeController, data);
    return this;
  }

  withKeyringController(data) {
    merge(this.fixture.data.KeyringController, data);
    return this;
  }

  withKeyringControllerAdditionalAccountVault() {
    return this.withKeyringController({
      vault:
        '{"data":"n1LbLX7D4CdnFjYkyvn8Vfv0VQ0spMTdzCP+bsrZX2cQXiz+GXb9AKaIjbcR0EHuQ5/VulkrpbZFDSYJ5VlZ5VRVVUngckHCNgzw73Jo3D+fVrmwEn6HhBbA+STHRMdjf3eEL/eiS5HbkQ0zutoj8KU/nMPfTz6iuV+WGa0hcOKZa+mqYkSzeYuqVCnWYspjF9hKE5NKnl5Vrnvu3/eFi6PiDeaUbIfs0ccttopnTdQya5e3KB23tu0ORa48EJawK0JeKurLlFfNNNqq+tg3HRgxUyiVp6mCns8GBdsd9Wx3HP00qIJa4OAFV2TtDvSSuek1XAWlIqjKegZbnXosB0t3IABhqWnSozXRFvsHe8oHVZP++B/2pJPzz5kkAgK9Ya/quy/7ok/GN5qw0n9Q6cCexfm9hGC3MI53ClEg08yq2w/eVKMDeEdES6IqidpRxOanIAsrcDjPIw6yP7tXqzo7d4A/50GyBb5MJYeTD7r9bV5/5VWcHtILDyGt4CROgM9/U/wdKduNJy5Igfhh0nvA0399Ber9jvWmtmQxiWAxAgrcf9Xi0SZXWewH/ZEnAOkIOmTVX9hpAGkbDqIvK1Zt2bIK5X/At2KiZ5DqAFet9AiyLZTPR5YQ2KaB8AarEjUthTa7EcDSpAPsr9jLPZwlKuMZO2I29xZHx4ht4ozlcqU+zMF8JBojtP73cRQKc0Chqm8xY9I9K6jANdZn9lT+q20RDgwJAfkp+UUSTTqUgZ3ruej2FyY9F+GWuOZJY1zPN0KG7j7uPXaP5Gqq","iv":"XxlC9CCaul7U0F6JRNyH9A==","salt":"gQOYCUFPAPVJITl0gxIs8TdgNQNl2ltzu4OAHajj+tM="}',
    });
  }

  withKeyringControllerImportedAccountVault() {
    return this.withKeyringController({
      vault:
        '{"data":"Ot+BTtJPag0xubdiv1nO9bsSvTHivHCd6CD7Lxgb1McYw3VqMjgp5rPMZmblJ1lscuMxyiqp99G52uXO9S0em6F9htpa+t/wn6qubRKTTNG9fxNzQrKXRDNhdgfYckVk5VAZ4fgl2iMZcRDvS8H/+gucVKJ33Sl6mXyPofdexXhWDCU6uR2YecnfaIum9cL2u/GqOMPE3jxzy0Wip0x2Jyp3QOKhvu8A3GIjzagLOaQ7a1APdl8=","iv":"lbsyPeGYWU6U1+jvmW9UHg==","salt":"Zmbhpskwxe4rYfXtELBvlcvW4HISPBATRmMqzsnZPMg="}',
    });
  }

  withMetaMetricsController(data) {
    merge(this.fixture.data.MetaMetricsController, data);
    return this;
  }

  withNetworkController(data) {
    merge(this.fixture.data.NetworkController, data);
    return this;
  }

  withNetworkControllerOnMainnet() {
    merge(this.fixture.data.NetworkController, {
      providerConfig: {
        chainId: CHAIN_IDS.MAINNET,
        nickname: '',
        rpcUrl: '',
        type: NETWORK_TYPES.MAINNET,
      },
    });
    return this;
  }

  withNetworkControllerDoubleGanache() {
    return this.withNetworkController({
      networkConfigurations: {
        networkConfigurationId: {
          chainId: CHAIN_IDS.LOCALHOST,
          nickname: 'Localhost 8545',
          rpcPrefs: {},
          rpcUrl: 'http://localhost:8545',
          ticker: 'ETH',
          networkConfigurationId: 'networkConfigurationId',
        },
        '76e9cd59-d8e2-47e7-b369-9c205ccb602c': {
          id: '76e9cd59-d8e2-47e7-b369-9c205ccb602c',
          rpcUrl: 'http://localhost:8546',
          chainId: '0x53a',
          ticker: 'ETH',
          nickname: 'Localhost 8546',
          rpcPrefs: {},
        },
      },
    });
  }

  withNftController(data) {
    merge(
      this.fixture.data.NftController
        ? this.fixture.data.NftController
        : (this.fixture.data.NftController = {}),
      data,
    );
    return this;
  }

  withNftControllerERC1155() {
    return this.withNftController({
      allNftContracts: {
        '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
          [toHex(1337)]: [
            {
              address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.ERC1155}`,
            },
          ],
        },
      },
      allNfts: {
        '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
          [toHex(1337)]: [
            {
              address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.ERC1155}`,
              tokenId: '1',
              favorite: false,
              isCurrentlyOwned: true,
              name: 'Rocks',
              description: 'This is a collection of Rock NFTs.',
              image:
                'ipfs://bafkreifvhjdf6ve4jfv6qytqtux5nd4nwnelioeiqx5x2ez5yrgrzk7ypi',
              standard: 'ERC1155',
            },
          ],
        },
      },
      ignoredNfts: [],
    });
  }

  withNftControllerERC721() {
    return this.withNftController({
      allNftContracts: {
        '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
          [toHex(1337)]: [
            {
              address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.NFTS}`,
              name: 'TestDappNFTs',
              symbol: 'TDC',
            },
          ],
        },
      },
      allNfts: {
        '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
          [toHex(1337)]: [
            {
              address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.NFTS}`,
              description: 'Test Dapp NFTs for testing.',
              favorite: false,
              image:
                'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==',
              isCurrentlyOwned: true,
              name: 'Test Dapp NFTs #1',
              standard: 'ERC721',
              tokenId: '1',
            },
          ],
        },
      },
      ignoredNfts: [],
    });
  }

  withOnboardingController(data) {
    merge(this.fixture.data.OnboardingController, data);
    return this;
  }

  withPermissionController(data) {
    merge(this.fixture.data.PermissionController, data);
    return this;
  }

  withPermissionControllerConnectedToTestDapp(restrictReturnedAccounts = true) {
    return this.withPermissionController({
      subjects: {
        [DAPP_URL]: {
          origin: DAPP_URL,
          permissions: {
            eth_accounts: {
              id: 'ZaqPEWxyhNCJYACFw93jE',
              parentCapability: 'eth_accounts',
              invoker: DAPP_URL,
              caveats: restrictReturnedAccounts && [
                {
                  type: 'restrictReturnedAccounts',
                  value: [
                    '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                    '0x09781764c08de8ca82e156bbf156a3ca217c7950',
                  ],
                },
              ],
              date: 1664388714636,
            },
          },
        },
      },
    });
  }

  withPermissionControllerConnectedToTwoTestDapps(
    restrictReturnedAccounts = true,
  ) {
    return this.withPermissionController({
      subjects: {
        [DAPP_URL]: {
          origin: DAPP_URL,
          permissions: {
            eth_accounts: {
              id: 'ZaqPEWxyhNCJYACFw93jE',
              parentCapability: 'eth_accounts',
              invoker: DAPP_URL,
              caveats: restrictReturnedAccounts && [
                {
                  type: 'restrictReturnedAccounts',
                  value: [
                    '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                    '0x09781764c08de8ca82e156bbf156a3ca217c7950',
                  ],
                },
              ],
              date: 1664388714636,
            },
          },
        },
        [DAPP_ONE_URL]: {
          origin: DAPP_ONE_URL,
          permissions: {
            eth_accounts: {
              id: 'AqPEWxyhNCJYACFw93jE4',
              parentCapability: 'eth_accounts',
              invoker: DAPP_ONE_URL,
              caveats: restrictReturnedAccounts && [
                {
                  type: 'restrictReturnedAccounts',
                  value: [
                    '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                    '0x09781764c08de8ca82e156bbf156a3ca217c7950',
                  ],
                },
              ],
              date: 1664388714636,
            },
          },
        },
      },
    });
  }

  withPermissionControllerConnectedToSnapDapp() {
    return this.withPermissionController({
      subjects: {
        'https://metamask.github.io': {
          origin: 'https://metamask.github.io',
          permissions: {
            [WALLET_SNAP_PERMISSION_KEY]: {
              caveats: [
                {
                  type: SnapCaveatType.SnapIds,
                  value: {
                    'npm@metamask/test-snap-bip32': {},
                    'npm@metamask/test-snap-bip44': {},
                    'npm@metamask/test-snap-error': {},
                    'npm@metamask/test-snap-managestate': {},
                    'npm@metamask/test-snap-notification': {},
                  },
                },
              ],
              id: 'CwdJq0x8N_b9FNxn6dVuP',
              parentCapability: WALLET_SNAP_PERMISSION_KEY,
              invoker: 'https://metamask.github.io',
              date: 1664388714636,
            },
          },
        },
      },
    });
  }

  withPermissionLogController(data) {
    merge(
      this.fixture.data.PermissionLogController
        ? this.fixture.data.PermissionLogController
        : (this.fixture.data.PermissionLogController = {}),
      data,
    );
    return this;
  }

  withPreferencesController(data) {
    merge(this.fixture.data.PreferencesController, data);
    return this;
  }

  withPreferencesControllerAdditionalAccountIdentities() {
    return this.withPreferencesController({
      identites: {
        '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
          address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          lastSelected: 1665507600000,
          name: 'Account 1',
        },
        '0x09781764c08de8ca82e156bbf156a3ca217c7950': {
          address: '0x09781764c08de8ca82e156bbf156a3ca217c7950',
          lastSelected: 1665507500000,
          name: 'Account 2',
        },
      },
    });
  }

  withPreferencesControllerImportedAccountIdentities() {
    return this.withPreferencesController({
      identities: {
        '0x0cc5261ab8ce458dc977078a3623e2badd27afd3': {
          name: 'Account 1',
          address: '0x0cc5261ab8ce458dc977078a3623e2badd27afd3',
          lastSelected: 1665507600000,
        },
        '0x3ed0ee22e0685ebbf07b2360a8331693c413cc59': {
          name: 'Account 2',
          address: '0x3ed0ee22e0685ebbf07b2360a8331693c413cc59',
        },
        '0xd38d853771fb546bd8b18b2f3638491bc0b0e906': {
          name: 'Account 3',
          address: '0xd38d853771fb546bd8b18b2f3638491bc0b0e906',
        },
      },
      selectedAddress: '0x0cc5261ab8ce458dc977078a3623e2badd27afd3',
    });
  }

  withAccountsController(data) {
    merge(this.fixture.data.AccountsController, data);
    return this;
  }

  withAccountsControllerImportedAccount() {
    return this.withAccountsController({
      internalAccounts: {
        selectedAccount: '2fdb2de6-80c7-4d2f-9f95-cb6895389843',
        accounts: {
          '2fdb2de6-80c7-4d2f-9f95-cb6895389843': {
            id: '2fdb2de6-80c7-4d2f-9f95-cb6895389843',
            address: '0x0cc5261ab8ce458dc977078a3623e2badd27afd3',
            options: {},
            methods: [
              'personal_sign',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
            metadata: {
              name: 'Account 1',
              lastSelected: 1665507600000,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
          '58093703-57e9-4ea9-8545-49e8a75cb084': {
            id: '58093703-57e9-4ea9-8545-49e8a75cb084',
            address: '0x3ed0ee22e0685ebbf07b2360a8331693c413cc59',
            options: {},
            methods: [
              'personal_sign',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
            metadata: {
              name: 'Account 2',
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
          'dd658aab-abf2-4f53-b735-c8a57151d447': {
            id: 'dd658aab-abf2-4f53-b735-c8a57151d447',
            address: '0xd38d853771fb546bd8b18b2f3638491bc0b0e906',
            options: {},
            methods: [
              'personal_sign',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
            metadata: {
              name: 'Account 3',
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
        },
      },
    });
  }

  withAccountsControllerAdditionalAccountIdentities() {
    return this.withAccountsController({
      internalAccounts: {
        selectedAccount: '2fdb2de6-80c7-4d2f-9f95-cb6895389843',
        accounts: {
          '2fdb2de6-80c7-4d2f-9f95-cb6895389843': {
            id: '2fdb2de6-80c7-4d2f-9f95-cb6895389843',
            address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            options: {},
            methods: [
              'personal_sign',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
            metadata: {
              name: 'Account 1',
              lastSelected: 1665507600000,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
          'dd658aab-abf2-4f53-b735-c8a57151d447': {
            id: 'dd658aab-abf2-4f53-b735-c8a57151d447',
            address: '0x09781764c08de8ca82e156bbf156a3ca217c7950',
            options: {},
            methods: [
              'personal_sign',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
            metadata: {
              name: 'Account 2',
              lastSelected: 1665507500000,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
        },
      },
    });
  }

  withPreferencesControllerNftDetectionEnabled() {
    return this.withPreferencesController({
      openSeaEnabled: true,
      useNftDetection: true,
    });
  }

  withSmartTransactionsController(data) {
    merge(this.fixture.data.SmartTransactionsController, data);
    return this;
  }

  withSubjectMetadataController(data) {
    merge(this.fixture.data.SubjectMetadataController, data);
    return this;
  }

  withTokenListController(data) {
    merge(
      this.fixture.data.TokenListController
        ? this.fixture.data.TokenListController
        : (this.fixture.data.TokenListController = {}),
      data,
    );
    return this;
  }

  withTokensController(data) {
    merge(this.fixture.data.TokensController, data);
    return this;
  }

  withBadPreferencesControllerState() {
    merge(this.fixture.data, {
      PreferencesController: 5,
    });
    return this;
  }

  withTokensControllerERC20() {
    merge(this.fixture.data.TokensController, {
      tokens: [
        {
          address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.HST}`,
          symbol: 'TST',
          decimals: 4,
          image:
            'https://static.metafi.codefi.network/api/v1/tokenIcons/1337/0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947.png',
          isERC721: false,
          aggregators: [],
        },
      ],
      ignoredTokens: [],
      detectedTokens: [],
      allTokens: {
        [toHex(1337)]: {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
            {
              address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.HST}`,
              symbol: 'TST',
              decimals: 4,
              image:
                'https://static.metafi.codefi.network/api/v1/tokenIcons/1337/0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947.png',
              isERC721: false,
              aggregators: [],
            },
          ],
        },
      },
      allIgnoredTokens: {},
      allDetectedTokens: {},
    });
    return this;
  }

  withTransactionController(data) {
    merge(
      this.fixture.data.TransactionController
        ? this.fixture.data.TransactionController
        : (this.fixture.data.TransactionController = {}),
      data,
    );
    return this;
  }

  withTransactionControllerMultipleTransactions() {
    return this.withTransactionController({
      transactions: {
        '7087d1d7-f0e8-4c0f-a903-6d9daa392baf': {
          chainId: CHAIN_IDS.LOCALHOST,
          dappSuggestedGasFees: {
            gas: '0x5208',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
          },
          history: [
            {
              chainId: CHAIN_IDS.LOCALHOST,
              dappSuggestedGasFees: {
                gas: '0x5208',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
              },
              id: '7087d1d7-f0e8-4c0f-a903-6d9daa392baf',
              loadingDefaults: true,
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545991949,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545992244,
                value: false,
              },
            ],
          ],
          id: '7087d1d7-f0e8-4c0f-a903-6d9daa392baf',
          loadingDefaults: false,
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545991949,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
        '6eab4240-3762-4581-abc5-cd91eab6964e': {
          chainId: CHAIN_IDS.LOCALHOST,
          dappSuggestedGasFees: {
            gas: '0x5208',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
          },
          history: [
            {
              chainId: CHAIN_IDS.LOCALHOST,
              dappSuggestedGasFees: {
                gas: '0x5208',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
              },
              id: '6eab4240-3762-4581-abc5-cd91eab6964e',
              loadingDefaults: true,
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545994578,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545994695,
                value: false,
              },
            ],
          ],
          id: '6eab4240-3762-4581-abc5-cd91eab6964e',
          loadingDefaults: false,
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545994578,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
        'c15eee26-11d6-4914-a70e-36ef9a3bcacb': {
          chainId: CHAIN_IDS.LOCALHOST,
          dappSuggestedGasFees: {
            gas: '0x5208',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
          },
          history: [
            {
              chainId: CHAIN_IDS.LOCALHOST,
              dappSuggestedGasFees: {
                gas: '0x5208',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
              },
              id: 'c15eee26-11d6-4914-a70e-36ef9a3bcacb',
              loadingDefaults: true,
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545996673,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545996678,
                value: false,
              },
            ],
          ],
          id: 'c15eee26-11d6-4914-a70e-36ef9a3bcacb',
          loadingDefaults: false,
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545996673,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
        'dfa9e5ad-d069-46b1-976e-a23734971d87': {
          chainId: CHAIN_IDS.LOCALHOST,
          dappSuggestedGasFees: {
            gas: '0x5208',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
          },
          history: [
            {
              chainId: CHAIN_IDS.LOCALHOST,
              dappSuggestedGasFees: {
                gas: '0x5208',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
              },
              id: 'dfa9e5ad-d069-46b1-976e-a23734971d87',
              loadingDefaults: true,
              origin: 'https://metamask.github.io',
              status: 'unapproved',
              time: 1631545998675,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
                value: '0x29a2241af62c0000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1631545998677,
                value: false,
              },
            ],
          ],
          id: 'dfa9e5ad-d069-46b1-976e-a23734971d87',
          loadingDefaults: false,
          origin: 'https://metamask.github.io',
          status: 'unapproved',
          time: 1631545998675,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
            to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
            value: '0x29a2241af62c0000',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  withTransactionControllerTypeOneTransaction() {
    return this.withTransactionController({
      transactions: {
        '13a01e77-a368-4bb9-aba9-e7435580e3b9': {
          chainId: CHAIN_IDS.LOCALHOST,
          history: [
            {
              chainId: CHAIN_IDS.LOCALHOST,
              id: '13a01e77-a368-4bb9-aba9-e7435580e3b9',
              loadingDefaults: true,
              origin: 'metamask',
              status: 'unapproved',
              time: 1617228030067,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x61a8',
                gasPrice: '0x2540be400',
                to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                value: '0xde0b6b3a7640000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1617228030069,
                value: false,
              },
            ],
          ],
          id: '13a01e77-a368-4bb9-aba9-e7435580e3b9',
          loadingDefaults: false,
          origin: 'metamask',
          primaryTransaction: {
            chainId: CHAIN_IDS.LOCALHOST,
            id: '13a01e77-a368-4bb9-aba9-e7435580e3b9',
            loadingDefaults: true,
            origin: 'metamask',
            status: 'unapproved',
            time: 1617228030067,
            txParams: {
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              gas: '0x61a8',
              gasPrice: '0x2540be400',
              to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
              value: '0xde0b6b3a7640000',
            },
            type: 'sentEther',
          },
          status: 'unapproved',
          time: 1617228030067,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x61a8',
            gasPrice: '0x2540be400',
            to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            value: '0xde0b6b3a7640000',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  withTransactionControllerTypeTwoTransaction() {
    return this.withTransactionController({
      transactions: {
        '13a01e77-a368-4bb9-aba9-e7435580e3b9': {
          chainId: CHAIN_IDS.LOCALHOST,
          history: [
            {
              chainId: CHAIN_IDS.LOCALHOST,
              id: '13a01e77-a368-4bb9-aba9-e7435580e3b9',
              loadingDefaults: true,
              origin: 'metamask',
              status: 'unapproved',
              time: 1617228030067,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x61a8',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
                to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                type: '0x2',
                value: '0xde0b6b3a7640000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1617228030069,
                value: false,
              },
            ],
          ],
          id: '13a01e77-a368-4bb9-aba9-e7435580e3b9',
          loadingDefaults: false,
          origin: 'metamask',
          primaryTransaction: {
            chainId: CHAIN_IDS.LOCALHOST,
            id: '13a01e77-a368-4bb9-aba9-e7435580e3b9',
            loadingDefaults: true,
            origin: 'metamask',
            status: 'unapproved',
            time: 1617228030067,
            txParams: {
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              gas: '0x61a8',
              maxFeePerGas: '0x59682f0c',
              maxPriorityFeePerGas: '0x59682f00',
              to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
              type: '0x2',
              value: '0xde0b6b3a7640000',
            },
            type: 'sentEther',
          },
          status: 'unapproved',
          time: 1617228030067,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x61a8',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
            to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            type: '0x2',
            value: '0xde0b6b3a7640000',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  withTransactionControllerApprovedTransaction() {
    return this.withTransactionController({
      transactions: {
        '13a01e77-a368-4bb9-aba9-e7435580e3b9': {
          chainId: CHAIN_IDS.LOCALHOST,
          history: [
            {
              chainId: CHAIN_IDS.LOCALHOST,
              id: '13a01e77-a368-4bb9-aba9-e7435580e3b9',
              loadingDefaults: true,
              origin: 'metamask',
              status: 'unapproved',
              time: 1617228030067,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x61a8',
                maxFeePerGas: '0x59682f0c',
                maxPriorityFeePerGas: '0x59682f00',
                to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                type: '0x2',
                value: '0xde0b6b3a7640000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1617228030069,
                value: false,
              },
            ],
            [
              {
                op: 'add',
                path: '/txParams/nonce',
                value: '0x0',
                note: 'transactions#approveTransaction',
                timestamp: 1617228031069,
              },
            ],
          ],
          id: '13a01e77-a368-4bb9-aba9-e7435580e3b9',
          loadingDefaults: false,
          origin: 'metamask',
          primaryTransaction: {
            chainId: CHAIN_IDS.LOCALHOST,
            id: '13a01e77-a368-4bb9-aba9-e7435580e3b9',
            loadingDefaults: true,
            origin: 'metamask',
            status: 'approved',
            time: 1617228030067,
            txParams: {
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              gas: '0x61a8',
              maxFeePerGas: '0x59682f0c',
              maxPriorityFeePerGas: '0x59682f00',
              to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
              type: '0x2',
              value: '0xde0b6b3a7640000',
            },
            type: 'sentEther',
          },
          status: 'approved',
          time: 1617228030067,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x61a8',
            maxFeePerGas: '0x59682f0c',
            maxPriorityFeePerGas: '0x59682f00',
            to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            type: '0x2',
            value: '0xde0b6b3a7640000',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  withTransactionControllerCompletedTransaction() {
    return this.withTransactionController({
      transactions: {
        '0c9342ce-ef3f-4cab-9425-8e57144256a6': {
          chainId: CHAIN_IDS.LOCALHOST,
          history: [
            {
              chainId: CHAIN_IDS.LOCALHOST,
              id: '0c9342ce-ef3f-4cab-9425-8e57144256a6',
              loadingDefaults: true,
              origin: 'metamask',
              status: 'unapproved',
              time: 1671635506502,
              txParams: {
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                gas: '0x5208',
                maxFeePerGas: '0x4c03c96f8',
                maxPriorityFeePerGas: '0x59682f00',
                to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                type: '0x2',
                value: '0xde0b6b3a7640000',
              },
              type: 'simpleSend',
            },
            [
              {
                note: 'Added new unapproved transaction.',
                op: 'replace',
                path: '/loadingDefaults',
                timestamp: 1671635506520,
                value: false,
              },
            ],
            [
              {
                note: 'confTx: user approved transaction',
                op: 'replace',
                path: '/txParams/maxFeePerGas',
                timestamp: 1671635510589,
                value: '0x4d7fc07fb',
              },
            ],
            [
              {
                note: 'txStateManager: setting status to approved',
                op: 'replace',
                path: '/status',
                timestamp: 1671635510589,
                value: 'approved',
              },
            ],
            [
              {
                note: 'transactions#approveTransaction',
                op: 'add',
                path: '/txParams/nonce',
                timestamp: 1671635510592,
                value: '0x2',
              },
            ],
            [
              {
                note: 'txStateManager: setting status to signed',
                op: 'replace',
                path: '/status',
                timestamp: 1671635510651,
                value: 'signed',
              },
            ],
            [
              {
                note: 'transactions#publishTransaction',
                op: 'add',
                path: '/rawTx',
                timestamp: 1671635510653,
                value:
                  '0x02f87205028459682f008504d7fc07fb825208947d17148ed7ec802e4458e94deec1ef28aef645e987038d7ea4c6800080c001a0c60aeaef1556a52b009e3973f06c64d5cd6dc935463afd0d2b1c00661655e47ea061b121db8f2cb2241b1454d1794256e5634d26a5b873e89a816efe210377492a',
              },
            ],
            [
              {
                note: 'txStateManager: setting status to submitted',
                op: 'replace',
                path: '/status',
                timestamp: 1671635510753,
                value: 'submitted',
              },
            ],
            [
              {
                note: 'txStateManager: setting status to confirmed',
                op: 'replace',
                path: '/status',
                timestamp: 1671635522978,
                value: 'confirmed',
              },
              {
                op: 'add',
                path: '/txReceipt',
                value: {
                  blockNumber: '7cbf95',
                  from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                  gasUsed: '5208',
                  status: '0x1',
                  to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                  type: '0x2',
                },
              },
            ],
            [
              {
                note: 'transactions#confirmTransaction - add txReceipt',
                op: 'replace',
                path: '/blockTimestamp',
                timestamp: 1671635522999,
                value: '63a32240',
              },
            ],
          ],
          id: '0c9342ce-ef3f-4cab-9425-8e57144256a6',
          loadingDefaults: false,
          origin: 'metamask',
          status: 'confirmed',
          submittedTime: 1671635510753,
          time: 1671635506502,
          txParams: {
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            gas: '0x5208',
            to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            type: '0x2',
            value: '0xde0b6b3a7640000',
          },
          hash: '0xe5e7b95690f584b8f66b33e31acc6184fea553fa6722d42486a59990d13d5fa2',
          txReceipt: {
            blockNumber: {
              length: 1,
              negative: 0,
              words: [8175509, null],
            },
            from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            status: '0x1',
            to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
            type: '0x2',
          },
          type: 'simpleSend',
        },
      },
    });
  }

  withTransactionControllerIncomingTransaction() {
    return this.withTransactionController({
      transactions: {
        '8a13fd36-fdad-48ae-8b6a-c8991026d550': {
          blockNumber: '1',
          chainId: CHAIN_IDS.LOCALHOST,
          hash: '0xf1af8286e4fa47578c2aec5f08c108290643df978ebc766d72d88476eee90bab',
          id: '8a13fd36-fdad-48ae-8b6a-c8991026d550',
          status: 'confirmed',
          time: 1671635520000,
          txParams: {
            from: '0xc87261ba337be737fa744f50e7aaf4a920bdfcd6',
            gas: '0x5208',
            gasPrice: '0x329af9707',
            to: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            value: '0xDE0B6B3A7640000',
          },
          type: 'incoming',
        },
      },
    });
  }

  withTransactionControllerCompletedAndIncomingTransaction() {
    const completedTransaction =
      this.withTransactionControllerCompletedTransaction().fixture.data
        .TransactionController.transactions;

    const incomingTransaction =
      this.withTransactionControllerIncomingTransaction().fixture.data
        .TransactionController.transactions;

    return this.withTransactionController({
      transactions: {
        ...completedTransaction,
        ...incomingTransaction,
      },
    });
  }

  withNameController(data) {
    merge(
      this.fixture.data.NameController
        ? this.fixture.data.NameController
        : (this.fixture.data.NameController = {}),
      data,
    );
    return this;
  }

  withNoNames() {
    return this.withNameController({ names: {} });
  }

  build() {
    this.fixture.meta = {
      version: 74,
    };
    return this.fixture;
  }
}

module.exports = FixtureBuilder;
