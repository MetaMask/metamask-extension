const {
  WALLET_SNAP_PERMISSION_KEY,
  SnapCaveatType,
} = require('@metamask/snaps-utils');
const { merge, mergeWith } = require('lodash');
const { toHex } = require('@metamask/controller-utils');
const {
  ETHERSCAN_SUPPORTED_CHAIN_IDS,
} = require('@metamask/preferences-controller');
const { mockNetworkStateOld } = require('../stub/networks');

const { CHAIN_IDS } = require('../../shared/constants/network');
const { SMART_CONTRACTS } = require('./seeder/smart-contracts');
const {
  DAPP_URL,
  DAPP_URL_LOCALHOST,
  DAPP_ONE_URL,
  DEFAULT_FIXTURE_ACCOUNT,
} = require('./constants');
const {
  defaultFixture,
  FIXTURE_STATE_METADATA_VERSION,
} = require('./default-fixture');

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
      },
      NetworkController: {
        ...mockNetworkStateOld({
          id: 'networkConfigurationId',
          chainId: CHAIN_IDS.LOCALHOST,
          nickname: 'Localhost 8545',
          rpcUrl: 'http://localhost:8545',
          ticker: 'ETH',
          blockExplorerUrl: undefined,
        }),
        providerConfig: { id: 'networkConfigurationId' },
      },
      NetworkOrderController: {
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.LOCALHOST]: true,
          },
          solana: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
          },
        },
      },
      NotificationServicesController: {},
      PreferencesController: {
        advancedGasFee: {},
        currentLocale: 'en',
        dismissSeedBackUpReminder: false,
        overrideContentSecurityPolicyHeader: true,
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
          showExtensionInFullSizeView: false,
          showFiatInTestnets: false,
          privacyMode: false,
          showTestNetworks: false,
          smartTransactionsOptInStatus: true,
          showNativeTokenAsMainBalance: true,
          petnamesEnabled: true,
          showMultiRpcModal: false,
          showConfirmationAdvancedDetails: false,
          tokenSortConfig: {
            key: 'tokenFiatAmount',
            order: 'dsc',
            sortCallback: 'stringNumeric',
          },
          tokenNetworkFilter: {},
          shouldShowAggregatedBalancePopover: true,
        },
        useExternalServices: true,
        theme: 'light',
        useBlockie: false,
        useNftDetection: false,
        usePhishDetect: true,
        useTokenDetection: false,
        useCurrencyRateCheck: true,
        useMultiAccountBalanceChecker: true,
        isMultiAccountBalancesEnabled: true,
        showIncomingTransactions: {
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.MAINNET]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.GOERLI]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.BSC]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.BSC_TESTNET]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.OPTIMISM]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.OPTIMISM_SEPOLIA]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.POLYGON]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.POLYGON_TESTNET]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.AVALANCHE]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.AVALANCHE_TESTNET]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.FANTOM]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.FANTOM_TESTNET]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.SEPOLIA]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.LINEA_GOERLI]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.LINEA_SEPOLIA]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.LINEA_MAINNET]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.MOONBEAM]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.MOONBEAM_TESTNET]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.MOONRIVER]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.GNOSIS]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.MEGAETH_TESTNET]: true,
          [ETHERSCAN_SUPPORTED_CHAIN_IDS.MONAD_TESTNET]: true,
        },
        skipDeepLinkInterstitial: false,
      },
      SelectedNetworkController: {
        domains: {},
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
      UserStorageController: {},
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
      },
      TransactionController: {},
      config: {},
      firstTimeInfo: {
        date: 1665507600000,
        version: '10.21.0',
      },
    },
  };
}

class FixtureBuilder {
  /**
   * Constructs a new instance of the FixtureBuilder class.
   *
   * @param {object} [options] - The options for the constructor.
   * @param {boolean} [options.onboarding] - Indicates if onboarding is enabled.
   * @param {string} [options.inputChainId] - The input chain ID.
   */
  constructor({ onboarding = false, inputChainId = CHAIN_IDS.LOCALHOST } = {}) {
    this.fixture =
      onboarding === true ? onboardingFixture() : defaultFixture(inputChainId);
  }

  withAccountTracker(data) {
    merge(this.fixture.data.AccountTracker, data);
    return this;
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

  withEnabledNetworks(data) {
    merge(this.fixture.data.NetworkOrderController, {
      networkOrder: this.fixture.data.NetworkOrderController?.networkOrder,
    });
    // Replace instead of merge for enabledNetworkMap
    this.fixture.data.NetworkOrderController.enabledNetworkMap = data;
    return this;
  }

  withAccountOrderController(data) {
    merge(this.fixture.data.AccountOrderController, data);
    return this;
  }

  withAppStateController(data) {
    merge(this.fixture.data.AppStateController, data);
    return this;
  }

  withCurrencyController(data) {
    merge(this.fixture.data.CurrencyController, data);
    return this;
  }

  withConversionRateDisabled() {
    return this.withPreferencesController({
      useCurrencyRateCheck: false,
    });
  }

  withShowFiatTestnetEnabled() {
    return this.withPreferencesController({
      preferences: {
        showFiatInTestnets: true,
      },
    });
  }

  withConversionRateEnabled() {
    return this.withPreferencesController({
      useCurrencyRateCheck: true,
    });
  }

  withUseBasicFunctionalityDisabled() {
    return this.withPreferencesController({
      useExternalServices: false,
    });
  }

  withUseBasicFunctionalityEnabled() {
    return this.withPreferencesController({
      useExternalServices: true,
    });
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
        '{"data":"XBb1KJiGsxNOhcTC/xtzaNmpDqnMibJ/HCIjMGUHF/jPIghM63+xkoGcko9T2NKjeMyt2QLbl7K9tr0/qQgbAJP/LUn6gfovkajBdeBQ5N/qztdw7uGJsnrKnzo1krmb2wWeFstwoolcZ9GYwhYVSmCO/tYba50eanY2XvmFheT1ghowtiFmTIGRWV2X1HacnpI4n0rW88ZyBaVuOJOIJGEBiiTD+b0V5l9Tv4sFEms4jvatJwhjDQnx1HmyQE3K64+W5yJe764B0ZdcQ6j2dyIaGgutcz8PoQLBJR1uo78fufZeFzk1gk/BreXn2+4vQnPxQ3prhnXHO4S+7Kj1h2ticxYb3XWnprFLWyksu9ChMyqDXwgM6edLBRDH2jz/IMuC5g9JhABl7PsSH+001z/uBx3GvRTFviFF9dztf195/EPy8YbuYUVbYtJy1aPSju84efWYvb7GrzrmgFnbeh2BpjyWqHoCTdw8fhdm7HQO8GFF7JdGtoIpjkhwPrudIQeIYhGCezd+n5GFp3mdmFNrLbOVFgxufTdY6hlYkg6c5XuHC2VnWCSPwWKIn6t9VuvuyIxXBnol/bgYC8R/d99ctkPDHykigQcgr6cCnhPOwUFOLwrmXqm9HQeWiKb8WxwdGeRnblS+fhFhB+lSy7RvyTUb7HFogDPnDLP/LlUFxdSNNBgqNJU1Dc07Np65PZrpsPvSCfkFttzTytHswhtTEMOg/faaH2D6AwIGbh5Z9cubiNcMrdD75aT1WGuecJ8P7uOMYJq9C7e5l/35","iv":"U81Cv/oryQ1DI9lRezx1iw==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"ejIn0xx5qZMA0m2ekjvXJF2pJa8ocL11wEdNIFJsKZQ="}',
    });
  }

  withKeyringControllerImportedAccountVault() {
    return this.withKeyringController({
      vault:
        '{"data":"NlxYVSDJJV4B1DWM+fZ0KX1K2lIU9ozK3WMbbL23WEY036umZ9//qB+bN9R1jKMm6xqHGSGgq9EteFMy2Ix5Bx1/c4hV2QquFRTEzPB4TkQ6+P5eJUvgvZ7vqvVU+2W8719T1oz/O7DH7HbO05JPLD1RBY+XOyHzUzAgwmXq0mwxNpqji3ejHyrjZ/1l06igircW/qysLcjZFZ52Vv4a/q1zCL37/4heHDRVmfEob//ulUbJ/5M=","iv":"b9n77dsUqvww9nGcWfPuIA==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"XrmM930Jqnb7C9Ow5NErAMkSGR3vuMLsqUrkGjzpwaY="}',
    });
  }

  withKeyringControllerOldVault() {
    return this.withKeyringController({
      vault:
        '{"data":"s6TpYjlUNsn7ifhEFTkuDGBUM1GyOlPrim7JSjtfIxgTt8/6MiXgiR/CtFfR4dWW2xhq85/NGIBYEeWrZThGdKGarBzeIqBfLFhw9n509jprzJ0zc2Rf+9HVFGLw+xxC4xPxgCS0IIWeAJQ+XtGcHmn0UZXriXm8Ja4kdlow6SWinB7sr/WM3R0+frYs4WgllkwggDf2/Tv6VHygvLnhtzp6hIJFyTjh+l/KnyJTyZW1TkZhDaNDzX3SCOHT","iv":"FbeHDAW5afeWNORfNJBR0Q==","salt":"TxZ+WbCW6891C9LK/hbMAoUsSEW1E8pyGLVBU6x5KR8="}',
    });
  }

  /**
   * Add a keyring controller with a vault that contains multiple SRP keyrings.
   *
   * @returns {FixtureBuilder}
   */
  withKeyringControllerMultiSRP() {
    return this.withKeyringController({
      vault:
        '{"data":"tM9QywcUa46iRvWsfvOL9mJqOrRLoVZoDuqTwxEt1Jz4qCpVIx8I/+7wMQuHBhe+DLBMSB7DzWeBpkCngTSE/mt6ygXWd96aKPH00PCW7uq/Z+8gdHQ3+ZGVCkTIDvLwOzG2gywrOfWRzRRcFwV545EV2iC6Q47A6KcgK/YokBeT4uVJ+oC309490eYn6/LkC+e+DNzJOlESs0LOynMJPMP0Wc53AvEuVlmYA2QLUKa+X6Eo1FEm91lg7znnNGTH7d7PVzDjElTQAUcQmiCvLfJU3cCmnVubarG/eOPWyL41u1z2IFMuf2QKoJNG7garFS+z4THtqWuR/NiYbNCJ70G6V2P0+9ntIWMk4qs4cBY4Pl3MPsyXBVhVoL+sLmuguY6iPijQVcPtd8G1HjTWOXNAVYSrdXjd4YHJuBBqgrjsqkkCHknilv6BiyHFH+pURP7zuPley9hiru5szuaKKU4NtpawQe0STQO5X35fI2xrH603etO9lhlK9lU+eFA+6jO0EynA1+HDIWT8iqX0gaOF6aPR/K1EKzbveP+EQbj7vIpOQs2+EJ4F4LYkExKczpvacgci84sLWGeT1e/aP1/dsVjuApUo0mtJaUtbljSvWoGuh6y8orTt6voyvHvbA+atPX+jla0/rWwy1lJ8o6PoXnyBMsgS+DSSamqXeMRKPI4S6GWiAMxLmvJvOEiC/uYRLrCzE0RxjIP9W6f2K+0VhAXJjPBp/t32NeHiwBfVeitdPwZUmMfhqzE0gvXyAd6cfzEnlyICfS8/DQkn74GDbdd1MdikdETCutDpiGEshacQT/scy0Z6n/5vuKkAGgrW66m39Ewqz6H2Rida5zgx1esrwZFy+8H57M2fa9KPa3ddye6J5Cd00JiqK/HiT20Uzt4h725iLNdkDrDT/mLlIGwbcSsSZxpTCYjtAAcN5JtWZNIp6xPOT889Tg9u3hHNy3g3VhVbYevtfTnVSgFFi+9B1JZ1OhL4NZC8bjyeNJ1pOUyLRZiRhgQ8aJPv5QytwDth+pJBvQslQ5UlrbhHRyd0RC0YrcyQ3WbapuDlJtdkkDuQg0OvevX+3F/Z/84uWvJ9qWBPkbOcn+ydULRDDouBmwsHqyY=","iv":"CR5flTdOsO77up6hbd8qQA==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"VY02O4NjlOhOKZI0/WPievKNVo2vOcg237YR5MrUW+c="}',
    });
  }

  withMetaMetricsController(data) {
    merge(this.fixture.data.MetaMetricsController, data);
    return this;
  }

  withNetworkController(data) {
    merge(this.fixture.data.NetworkController, data);
    this.fixture.data.NetworkController.providerConfig = {
      id: this.fixture.data.NetworkController.selectedNetworkClientId,
    };
    return this;
  }

  withNetworkControllerOnBnb() {
    return this.withNetworkController({
      networkConfigurations: {
        networkConfigurationId: {
          chainId: CHAIN_IDS.BSC,
          nickname: 'Binance Chain',
          rpcPrefs: {},
          rpcUrl: 'https://bsc-dataseed.binance.org',
          ticker: 'BNB',
          networkConfigurationId: 'networkConfigurationId',
          id: 'networkConfigurationId',
        },
      },
    });
  }

  withNetworkControllerOnMainnet() {
    return this.withNetworkController({ selectedNetworkClientId: 'mainnet' });
  }

  withNetworkControllerOnLinea() {
    return this.withNetworkController({
      selectedNetworkClientId: 'linea-mainnet',
    });
  }

  withNetworkControllerOnLineaLocahost() {
    return this.withNetworkController({
      networkConfigurations: {
        networkConfigurationId: {
          chainId: CHAIN_IDS.LINEA_MAINNET,
          nickname: 'Localhost 8545',
          rpcPrefs: {},
          rpcUrl: 'http://localhost:8545',
          ticker: 'ETH',
          networkConfigurationId: 'networkConfigurationId',
          id: 'networkConfigurationId',
        },
      },
    });
  }

  withNetworkControllerOnOptimism() {
    return this.withNetworkController({
      networkConfigurations: {
        networkConfigurationId: {
          chainId: CHAIN_IDS.OPTIMISM,
          nickname: 'Localhost 8545',
          rpcPrefs: {},
          rpcUrl: 'https://mainnet.infura.io',
          ticker: 'ETH',
          networkConfigurationId: 'networkConfigurationId',
          id: 'networkConfigurationId',
        },
      },
    });
  }

  withNetworkControllerOnPolygon() {
    return this.withNetworkController({
      networkConfigurations: {
        networkConfigurationId: {
          chainId: CHAIN_IDS.POLYGON,
          nickname: 'Polygon Mainnet',
          rpcPrefs: {},
          rpcUrl: 'https://mainnet.infura.io',
          ticker: 'ETH',
          networkConfigurationId: 'networkConfigurationId',
          id: 'networkConfigurationId',
        },
      },
    });
  }

  withNetworkControllerDoubleNode() {
    const secondNode = mockNetworkStateOld({
      id: '76e9cd59-d8e2-47e7-b369-9c205ccb602c',
      rpcUrl: 'http://localhost:8546',
      chainId: '0x53a',
      ticker: 'ETH',
      nickname: 'Localhost 8546',
    });
    delete secondNode.selectedNetworkClientId;
    return this.withNetworkController(secondNode);
  }

  withNetworkControllerTripleNode() {
    this.withNetworkControllerDoubleNode();
    const thirdNode = mockNetworkStateOld({
      rpcUrl: 'http://localhost:7777',
      chainId: '0x3e8',
      ticker: 'ETH',
      nickname: 'Localhost 7777',
      blockExplorerUrl: undefined,
    });

    delete thirdNode.selectedNetworkClientId;
    merge(this.fixture.data.NetworkController, thirdNode);
    return this;
  }

  withNetworkControllerOnMegaETH() {
    return this.withNetworkController({
      selectedNetworkClientId: 'megaeth-testnet',
      networkConfigurations: {
        'megaeth-testnet': {
          chainId: CHAIN_IDS.MEGAETH_TESTNET,
          nickname: 'Mega Testnet',
          rpcUrl: 'https://carrot.megaeth.com/rpc',
          ticker: 'MegaETH',
          rpcPrefs: {
            blockExplorerUrl: 'https://testnet.megaeth.com',
          },
          id: 'megaeth-testnet',
          type: 'rpc',
          isCustom: true,
        },
      },
    });
  }

  withNetworkControllerOnMonad() {
    return this.withNetworkController({
      selectedNetworkClientId: 'monad-testnet',
      networkConfigurations: {
        'monad-testnet': {
          chainId: CHAIN_IDS.MONAD_TESTNET,
          nickname: 'Monad Testnet',
          rpcUrl: 'https://testnet-rpc.monad.xyz',
          ticker: 'MON',
          rpcPrefs: {
            blockExplorerUrl: 'https://testnet.monadexplorer.com',
          },
          id: 'monad-testnet',
          type: 'rpc',
          isCustom: true,
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

  withDeFiPositionsController(data) {
    merge(
      this.fixture.data.DeFiPositionsController
        ? this.fixture.data.DeFiPositionsController
        : (this.fixture.data.DeFiPositionsController = {}),
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
              chainId: 1337,
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
              chainId: 1337,
            },
          ],
        },
      },
      ignoredNfts: [],
    });
  }

  withNotificationServicesController(data) {
    mergeWith(
      this.fixture.data.NotificationServicesController,
      data,
      (objValue, srcValue) => {
        if (Array.isArray(objValue)) {
          objValue.concat(srcValue);
        }
        return undefined;
      },
    );
    return this;
  }

  withOnboardingController(data) {
    merge(this.fixture.data.OnboardingController, data);
    return this;
  }

  withPermissionController(data) {
    merge(this.fixture.data.PermissionController, data);
    return this;
  }

  withBridgeControllerDefaultState() {
    this.fixture.data.BridgeController = {};
    return this;
  }

  withPermissionControllerConnectedToTestDapp({
    account = '',
    useLocalhostHostname = false,
  } = {}) {
    const selectedAccount = account || DEFAULT_FIXTURE_ACCOUNT;
    return this.withPermissionController({
      subjects: {
        [useLocalhostHostname ? DAPP_URL_LOCALHOST : DAPP_URL]: {
          origin: useLocalhostHostname ? DAPP_URL_LOCALHOST : DAPP_URL,
          permissions: {
            eth_accounts: {
              id: 'ZaqPEWxyhNCJYACFw93jE',
              parentCapability: 'eth_accounts',
              invoker: DAPP_URL,
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [selectedAccount.toLowerCase()],
                },
              ],
              date: 1664388714636,
            },
          },
        },
      },
    });
  }

  withPermissionControllerConnectedToTestDappWithChains(chainIds) {
    return this.withPermissionController({
      subjects: {
        [DAPP_URL]: {
          origin: DAPP_URL,
          permissions: {
            eth_accounts: {
              id: 'ZaqPEWxyhNCJYACFw93jE',
              parentCapability: 'eth_accounts',
              invoker: DAPP_URL,
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [DEFAULT_FIXTURE_ACCOUNT.toLowerCase()],
                },
              ],
              date: 1664388714636,
            },
            'endowment:permitted-chains': {
              id: 'D7cac0a2e3BD8f349506a',
              parentCapability: 'endowment:permitted-chains',
              invoker: DAPP_URL,
              caveats: [
                {
                  type: 'restrictNetworkSwitching',
                  value: chainIds,
                },
              ],
              date: 1664388714637,
            },
          },
        },
      },
    });
  }

  withPermissionControllerConnectedToMultichainTestDapp({
    account = '',
    useLocalhostHostname = false,
    value = null,
  } = {}) {
    const selectedAccount = account || DEFAULT_FIXTURE_ACCOUNT;
    const subjects = {
      [useLocalhostHostname ? DAPP_URL_LOCALHOST : DAPP_URL]: {
        origin: useLocalhostHostname ? DAPP_URL_LOCALHOST : DAPP_URL,
        permissions: {
          'endowment:caip25': {
            caveats: [
              {
                type: 'authorizedScopes',
                value: value ?? {
                  requiredScopes: {},
                  optionalScopes: {
                    'eip155:1337': {
                      accounts: [
                        `eip155:1337:${selectedAccount.toLowerCase()}`,
                      ],
                    },
                    'wallet:eip155': {
                      accounts: [
                        `wallet:eip155:${selectedAccount.toLowerCase()}`,
                      ],
                    },
                    wallet: {
                      accounts: [],
                    },
                  },
                  isMultichainOrigin: true,
                },
              },
            ],
            id: 'ZaqPEWxyhNCJYACFw93jE',
            date: 1664388714636,
            invoker: DAPP_URL,
            parentCapability: 'endowment:caip25',
          },
        },
      },
    };

    return this.withPermissionController({
      subjects,
    });
  }

  withPermissionControllerConnectedToMultichainTestDappWithTwoAccounts({
    scopes = ['eip155:1337'],
  }) {
    const optionalScopes = scopes
      .map((scope) => ({
        [scope]: {
          accounts: [
            `${scope}:0x5cfe73b6021e818b776b421b1c4db2474086a7e1`,
            `${scope}:0x09781764c08de8ca82e156bbf156a3ca217c7950`,
          ],
        },
      }))
      .reduce((acc, curr) => {
        return { ...acc, ...curr };
      }, {});

    const subjects = {
      [DAPP_URL]: {
        origin: DAPP_URL,
        permissions: {
          'endowment:caip25': {
            caveats: [
              {
                type: 'authorizedScopes',
                value: {
                  requiredScopes: {},
                  optionalScopes,
                  isMultichainOrigin: true,
                },
              },
            ],
            id: 'ZaqPEWxyhNCJYACFw93jE',
            date: 1664388714636,
            invoker: DAPP_URL,
            parentCapability: 'endowment:caip25',
          },
        },
      },
    };
    return this.withPermissionController({
      subjects,
    });
  }

  withPermissionControllerConnectedToTestDappWithTwoAccounts() {
    const subjects = {
      [DAPP_URL]: {
        origin: DAPP_URL,
        permissions: {
          eth_accounts: {
            id: 'ZaqPEWxyhNCJYACFw93jE',
            parentCapability: 'eth_accounts',
            invoker: DAPP_URL,
            caveats: [
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
    };
    return this.withPermissionController({
      subjects,
    });
  }

  withPermissionControllerSnapAccountConnectedToTestDapp() {
    return this.withPermissionController({
      subjects: {
        [DAPP_URL]: {
          origin: DAPP_URL,
          permissions: {
            eth_accounts: {
              id: 'ZaqPEWxyhNCJYACFw93jE',
              parentCapability: 'eth_accounts',
              invoker: DAPP_URL,
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x09781764c08de8ca82e156bbf156a3ca217c7950'],
                },
              ],
              date: 1664388714636,
            },
          },
        },
      },
    });
  }

  withPermissionControllerConnectedToTwoTestDapps() {
    return this.withPermissionController({
      subjects: {
        [DAPP_URL]: {
          origin: DAPP_URL,
          permissions: {
            eth_accounts: {
              id: 'ZaqPEWxyhNCJYACFw93jE',
              parentCapability: 'eth_accounts',
              invoker: DAPP_URL,
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x5cfe73b6021e818b776b421b1c4db2474086a7e1'],
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
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x5cfe73b6021e818b776b421b1c4db2474086a7e1'],
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
      identities: {
        '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
          address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          lastSelected: 1665507600000,
          name: 'Account 1',
        },
        '0x09781764c08de8ca82e156bbf156a3ca217c7950': {
          address: '0x09781764c08de8ca82e156bbf156a3ca217c7950',
          lastSelected: 1665507800000,
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

  withPreferencesControllerPetnamesDisabled() {
    return this.withPreferencesController({
      preferences: {
        petnamesEnabled: false,
      },
    });
  }

  withPreferencesControllerShowNativeTokenAsMainBalanceDisabled() {
    return this.withPreferencesController({
      preferences: {
        showNativeTokenAsMainBalance: false,
      },
    });
  }

  withPreferencesControllerTxSimulationsDisabled() {
    return this.withPreferencesController({
      useTransactionSimulations: false,
    });
  }

  /**
   * @deprecated this method should not be used, as the `smartTransactionsOptInStatus` value is overridden by the migration 135
   * Use the `toggleStxSetting` flow to disable this setting effectively.
   */
  withPreferencesControllerSmartTransactionsOptedOut() {
    return this.withPreferencesController({
      preferences: {
        smartTransactionsOptInStatus: false,
      },
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
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
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
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
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
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
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
        accounts: {
          'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
            id: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
            address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            options: {},
            methods: [
              'personal_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
            metadata: {
              name: 'Account 1',
              lastSelected: 1665507600000,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
          'e9976a84-110e-46c3-9811-e2da7b5528d3': {
            id: 'e9976a84-110e-46c3-9811-e2da7b5528d3',
            address: '0x09781764c08de8ca82e156bbf156a3ca217c7950',
            options: {},
            methods: [
              'personal_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
            metadata: {
              name: 'Account 2',
              lastSelected: 1665507800000,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
        },
      },
      selectedAccount: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
    });
  }

  withPreferencesControllerNftDetectionEnabled() {
    return this.withPreferencesController({
      openSeaEnabled: true,
      useNftDetection: true,
    });
  }

  withSelectedNetworkController(data) {
    merge(this.fixture.data.SelectedNetworkController, data);
    return this;
  }

  withSelectedNetworkControllerPerDomain() {
    return merge(
      this.withSelectedNetworkController({
        domains: {
          [DAPP_URL]: 'networkConfigurationId',
          [DAPP_ONE_URL]: '76e9cd59-d8e2-47e7-b369-9c205ccb602c',
        },
      }),
      this,
    );
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

  // withTokenRatesController(data) {
  //   merge(this.fixture.data.TokenRatesController, data);
  //   return this;
  // }

  withBadPreferencesControllerState() {
    merge(this.fixture.data, {
      PreferencesController: 5,
    });
    return this;
  }

  withTokensControllerERC20({ chainId = 1337 } = {}) {
    merge(this.fixture.data.TokensController, {
      allTokens: {
        [toHex(chainId)]: {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
            {
              address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.HST}`,
              symbol: 'TST',
              decimals: 4,
              image:
                'https://static.cx.metamask.io/api/v1/tokenIcons/1337/0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947.png',
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

  /*   Steps to create fixture:
   1. Reinstall clean metamask & Onboard
   2. Create 4 more accounts in the wallet
   3. Connected to ENS dapp on Account 1 and 3
   4. Connected to Uniswap dapp on Accounts 1 and 4
   5. Connected to Dextools dapp on Accounts 1, 2, and 3
   6. Connected to Coinmarketcap dapp on Account 1 (didnt log in)
   7. opened devtools and ran stateHooks.getCleanAppState() in console
  */
  withConnectionsToManyDapps() {
    return this.withPermissionController({
      subjects: {
        'https://app.ens.domains': {
          origin: 'https://app.ens.domains',
          permissions: {
            eth_accounts: {
              id: 'oKXoF_MNlffiR2u1Y3mDE',
              parentCapability: 'eth_accounts',
              invoker: 'https://app.ens.domains',
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [
                    '0xbee150bdc171c7d4190891e78234f791a3ac7b24',
                    '0xb9504634e5788208933b51ae7440b478bfadf865',
                  ],
                },
              ],
              date: 1708029792962,
            },
          },
        },
        'https://app.uniswap.org': {
          origin: 'https://app.uniswap.org',
          permissions: {
            eth_accounts: {
              id: 'vaa88u5Iv3VmsJwG3bDKW',
              parentCapability: 'eth_accounts',
              invoker: 'https://app.uniswap.org',
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [
                    '0xbee150bdc171c7d4190891e78234f791a3ac7b24',
                    '0xd1ca923697a701cba1364d803d72b4740fc39bc9',
                  ],
                },
              ],
              date: 1708029870079,
            },
          },
        },
        'https://www.dextools.io': {
          origin: 'https://www.dextools.io',
          permissions: {
            eth_accounts: {
              id: 'bvvPcFtIhkFyHyW0Tmwi4',
              parentCapability: 'eth_accounts',
              invoker: 'https://www.dextools.io',
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [
                    '0xbee150bdc171c7d4190891e78234f791a3ac7b24',
                    '0xa5c5293e124d04e2f85e8553851001fd2f192647',
                    '0xb9504634e5788208933b51ae7440b478bfadf865',
                  ],
                },
              ],
              date: 1708029948170,
            },
          },
        },
        'https://coinmarketcap.com': {
          origin: 'https://coinmarketcap.com',
          permissions: {
            eth_accounts: {
              id: 'AiblK84K1Cic-Y0FDSzMD',
              parentCapability: 'eth_accounts',
              invoker: 'https://coinmarketcap.com',
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0xbee150bdc171c7d4190891e78234f791a3ac7b24'],
                },
              ],
              date: 1708030049641,
            },
          },
        },
      },
      subjectMetadata: {
        'https://ens.domains': {
          iconUrl: null,
          name: 'ens.domains',
          subjectType: 'website',
          origin: 'https://ens.domains',
          extensionId: null,
        },
        'https://app.ens.domains': {
          iconUrl: 'https://app.ens.domains/favicon-32x32.png',
          name: 'ENS',
          subjectType: 'website',
          origin: 'https://app.ens.domains',
          extensionId: null,
        },
        'https://app.uniswap.org': {
          iconUrl: 'https://app.uniswap.org/favicon.png',
          name: 'Uniswap Interface',
          subjectType: 'website',
          origin: 'https://app.uniswap.org',
          extensionId: null,
        },
        'https://www.dextools.io': {
          iconUrl: 'https://www.dextools.io/app/favicon.ico',
          name: 'DEXTools.io',
          subjectType: 'website',
          origin: 'https://www.dextools.io',
          extensionId: null,
        },
        'https://coinmarketcap.com': {
          iconUrl: 'https://coinmarketcap.com/favicon.ico',
          name: 'CoinMarketCap',
          subjectType: 'website',
          origin: 'https://coinmarketcap.com',
          extensionId: null,
        },
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

  withLedgerAccount() {
    return this.withKeyringController({
      vault:
        '{"data":"kCehIbrW5j8AKVLEdUUaidsTomloRQLmLnEIYUA+HHMCJTJ9/dX+B692ExnrgWlZK4PySLTVoofQZjgQcKVMHi+mO5wnPV3p4sKKpv/w1zh0AIx5h25zDln5DbyHWjJtUKISOvKyLvZ02I0oqFvVGF6Wae/TNLelUleYwjP02h39//Fkgy8hukDNMmscBlX/Vx3iNwyie9X7FXKXMHrHcMhSjRJaZxri48SOWbchx31hfZuv8oP2l1yJkrWv82JjkiZYoQcbGkBRis06GnfFU62cKyqh9ZrIRHb6yj8g7SjRF5mMe7czA3QdJQjUMHJLq9IV2To+WOiOsKd+CVrjvNR9A1fWrRlAvQENDWO9FxaBuuBsNF2mm9KHqowSXD+/TUP1fiftyTnxs9mzojKReX8fPP0qjlIE7Sv71OfKvD1+7zW1udWmgoO+RcCFj3tQ5wXc6/MAYB2N2vfSHB9k+AgUYvajtaf0cb4gdm3KDPhriv1sDkOenaKbZLGLnsbfMWAbTQPrwCDdhiOvHBUfCVrV1ac0FlUIERdNkxDMwbd9BllyscPsif9VNuZCUzzeboTk0LTm1FszgFD8UxlvCfxB9Z5pZgk5ublhAkWZGZuckfVTEPofcELNx8VVf2Un8Yju8QzX7XGwNTTg/v5jLx52NrGWHvWIRUHRjnLK6hOVL26yRbds4e6FK4vsi1Hxi85HiiB1J2RX3gBfl14R2/1nCpLZePnEUaH6TgGPzsbzlJsSsCktGvMZaLdD","iv":"utoVJtRyaiuYF9PnhgZD8w==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"PwqqENo0YiZXcRrMzg+ujLG2VtyTNkKBCvFMsnzFefk="}',
    }).withPreferencesController({
      identities: {
        '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
          address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          lastSelected: 1665507600000,
          name: 'Account 1',
        },
        '0xf68464152d7289d7ea9a2bec2e0035c45188223c': {
          address: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
          lastSelected: 1665507800000,
          name: 'Ledger 1',
        },
      },
      selectedAddress: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
    });
  }

  withTrezorAccount() {
    return this.withAccountTracker({
      accounts: {
        '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
          address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          balance: '0x15af1d78b58c40000',
        },
        '0xf68464152d7289d7ea9a2bec2e0035c45188223c': {
          address: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
          balance: '0x100000000000000000000',
        },
      },
      currentBlockGasLimit: '0x1c9c380',
      accountsByChainId: {
        '0x539': {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
            address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            balance: '0x15af1d78b58c40000',
          },
          '0xf68464152d7289d7ea9a2bec2e0035c45188223c': {
            address: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
            balance: '0x100000000000000000000',
          },
        },
      },
      currentBlockGasLimitByChainId: {
        '0x539': '0x1c9c380',
      },
    })
      .withAccountsController({
        internalAccounts: {
          accounts: {
            'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
              id: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
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
              scopes: ['eip155:0'],
              metadata: {
                name: 'Account 1',
                importTime: 1724486724986,
                lastSelected: 1665507600000,
                keyring: {
                  type: 'HD Key Tree',
                },
              },
            },
            '221ecb67-0d29-4c04-83b2-dff07c263634': {
              id: '221ecb67-0d29-4c04-83b2-dff07c263634',
              address: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
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
              scopes: ['eip155:0'],
              metadata: {
                name: 'Trezor 1',
                importTime: 1724486729079,
                keyring: {
                  type: 'Trezor Hardware',
                },
                lastSelected: 1724486729083,
              },
            },
          },
          selectedAccount: '221ecb67-0d29-4c04-83b2-dff07c263634',
        },
      })
      .withKeyringController({
        vault:
          '{"data":"NPUZE4s9SQOrsw1GtJSnQ9ptC3J1nf3O+hWT3N8Oh5MDcyO0XojQfSBZL88FgjuAGMT+oFEnX8gzsd1x0/Z7iinNSOD+U22LJ6w37Pkfw4mqAYvKJDbnb2HAdjNbjGD99PKn1qe5eR0vohL5taFW2lTKdlE3dficITFM9wm9mQTegQVvYClTSktweumFSTMxqO1fUPj7oacLmw69ZAk2/am4fhI4c6ZeJoAkvPTJvYZDOne3WkUlcuUoeJjCX7b/59NQNHeCry8OyWVMCZDMYFsJT9Pk2vlFgnVL69n9dRGHrZNuNGFOhFawta5TqDUn1Ya7Iq0FjBW1WQv+HKktMM+RA8KZZyAAJkXYHRMpmUhQkw4wQFELgHjKFm/NIYcFVT5t6/XIj9kLqh4+55krUGoEHygzX41uSNie/wNmLjTgNAZv/eK9R81vyv1FR8N1fgkr13KxQT/0o/bQZhnaVClFa/3t13epiRrU/1plVh2TaI7HLFLj69d4c7w96J7Z33osjCywpNCJLam3Xx5OLAaPVe+L7a9u/zOMmryxX37xCrQhn9YSzZ0+E9Hik9CZU9ZXqmNgRhYAoqpcRWgMVmEC2HRLBIXXF0VTyYvfUvEfn87iAsqw0KeoQagDpUPsEr8UU9zs6cGRqZZTfR6/Wa3UwuIwV5XnCRg3Eifiz2BHKG4kutxKIJJak9habIfXBjxMrrwrHns7tWmWmE3JRYoekJQxFdWP3mcnDHVNz2VscgWeW5bZEoBim91iPRbsXimX9605xE0WOaHpwu27G9LwTNwL+0f8BgwoCcfMbaKwoDGVqKFOSbKurYBByPmWsm1b10vVrnsxA3VZMd2HWhicD7DE5h/4R+7Z90VthpVwt4NQ7+QmXeSXqCpPcoq7UTrchdYgV95xbKna1r0lSnZSfUMALji1I2Nh96ki24SbbUEeFZGm4dxNSnub07hTKF6xeqS1FvV79hBpZi/6v+pS+SDNSlwEcfRWW3S02Ec6JAhK2rVCQqSwasFcVcznYB5OaKL6QCmriIpqH0ATsthAwsf9naHSU+36wwi3xogxbpzecjaZ8gxKs2wmJk+Rz6VoGB+z9DTzvha5sm4DmfuQ2CtbQNYZq20VG3hO9g7wzWwa5xZmbH7njBDqlpaNgmxMrAX1S+T8D7X6ElD+aH0MyP9UD5E5tT5xxgUAV0wi+LY0+uCi2Y2lragFM7ihmPr1MP5wEy/1eIf45cY3imfl9w0F/FrCo+Hy2Au9AueCCab2eabA8QAum3lhXtdOyc123sSghIPjC6RUlZE53skLx1cPaV5JJAkneQJ44QMWecLQjh3YyCzRQ8XCnFAL+Kmf7zW5t+l25PLCkcfuLE7zxvLsTz3w2TCIXzEJyw1vXjBzPTUdKCNSva0WGsbq5B93zYot6bmvK1RKHeje8Ed/4N/l8uwxulUAjYQ+94qDKkxTVxvAZ8ydoxwKuB8QCTXgbymDsF/Y5l+RDXmzMT8BdN/QtdjsCXJ2PjvBG+srQOPntOCZMS7FVMk9yc6MWE/DBDm7HtY5CiY3af4A5sOZmLSP3Ek91ijmYdr/nO32DnkV4NJ2/Hj8SWAK5OD8zq8q5uRlR8BDcj7oLnzJX4S+yJNJ/nZSleUyTsv5v6YZ8hno","iv":"6SgfUVcvgUDGbCuqmdZgbA==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"nk4xdpmMR+1s5BYe4Vnk++XAQwrISI2bCtbMg7V1wUA="}',
      })
      .withNameController({
        names: {
          ethereumAddress: {
            '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
              '*': {
                name: 'Account 1',
                sourceId: null,
                proposedNames: {},
                origin: 'account-identity',
              },
            },
            '0xf68464152d7289d7ea9a2bec2e0035c45188223c': {
              '*': {
                proposedNames: {},
                name: 'Trezor 1',
                sourceId: null,
                origin: 'account-identity',
              },
            },
          },
        },
      })
      .withPreferencesController({
        identities: {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
            address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            lastSelected: 1665507600000,
            name: 'Account 1',
          },
          '0xf68464152d7289d7ea9a2bec2e0035c45188223c': {
            address: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
            lastSelected: 1665507800000,
            name: 'Trezor 1',
          },
        },
        lostIdentities: {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
            address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            name: 'Account 1',
            lastSelected: 1665507600000,
          },
          '0xf68464152d7289d7ea9a2bec2e0035c45188223c': {
            address: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
            name: 'Trezor 1',
            lastSelected: 1665507800000,
          },
        },
        selectedAddress: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
      });
  }

  withIncomingTransactionsCache(cache) {
    return this.withTransactionController({ lastFetchedBlockNumbers: cache });
  }

  withTransactions(transactions) {
    return this.withTransactionController({
      transactions,
    });
  }

  withPopularNetworks() {
    return this.withNetworkController({
      networkConfigurations: {
        'op-mainnet': {
          chainId: CHAIN_IDS.OPTIMISM,
          nickname: 'OP Mainnet',
          rpcPrefs: {},
          rpcUrl: 'https://mainnet.optimism.io',
          ticker: 'ETH',
          id: 'op-mainnet',
        },
        'polygon-mainnet': {
          chainId: CHAIN_IDS.POLYGON,
          nickname: 'Polygon Mainnet',
          rpcPrefs: {},
          rpcUrl: 'https://polygon-rpc.com',
          ticker: 'MATIC',
          id: 'polygon-mainnet',
        },
        'arbitrum-one': {
          chainId: CHAIN_IDS.ARBITRUM,
          nickname: 'Arbitrum One',
          rpcPrefs: {},
          rpcUrl: 'https://arb1.arbitrum.io/rpc',
          ticker: 'ETH',
          id: 'arbitrum-one',
        },
        'avalanche-mainnet': {
          chainId: CHAIN_IDS.AVALANCHE,
          nickname: 'Avalanche Network C-Chain',
          rpcPrefs: {},
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
          ticker: 'AVAX',
          id: 'avalanche-mainnet',
        },
        'bnb-mainnet': {
          chainId: CHAIN_IDS.BSC,
          nickname: 'BNB Chain',
          rpcPrefs: {},
          rpcUrl: 'https://bsc-dataseed.binance.org',
          ticker: 'BNB',
          id: 'bnb-mainnet',
        },
        'zksync-mainnet': {
          chainId: CHAIN_IDS.ZKSYNC_ERA,
          nickname: 'zkSync Era',
          rpcPrefs: {},
          rpcUrl: 'https://mainnet.era.zksync.io',
          ticker: 'ETH',
          id: 'zksync-mainnet',
        },
      },
    });
  }

  withSnapController(data) {
    this.fixture.data.SnapController ??= {};

    merge(this.fixture.data.SnapController, data);
    return this;
  }

  withSnapControllerOnStartLifecycleSnap() {
    return this.withPermissionController({
      subjects: {
        'npm:@metamask/lifecycle-hooks-example-snap': {
          origin: 'npm:@metamask/lifecycle-hooks-example-snap',
          permissions: {
            'endowment:lifecycle-hooks': {
              caveats: null,
              date: 1750244440562,
              id: '0eKn8SjGEH6o_6Mhcq3Lw',
              invoker: 'npm:@metamask/lifecycle-hooks-example-snap',
              parentCapability: 'endowment:lifecycle-hooks',
            },
            snap_dialog: {
              caveats: null,
              date: 1750244440562,
              id: 'Fbme_UWcuSK92JqfrT4G2',
              invoker: 'npm:@metamask/lifecycle-hooks-example-snap',
              parentCapability: 'snap_dialog',
            },
          },
        },
      },
    }).withSnapController({
      snaps: {
        'npm:@metamask/lifecycle-hooks-example-snap': {
          auxiliaryFiles: [],
          blocked: false,
          enabled: true,
          id: 'npm:@metamask/lifecycle-hooks-example-snap',
          initialPermissions: {
            'endowment:lifecycle-hooks': {},
            snap_dialog: {},
          },
          localizationFiles: [],
          manifest: {
            description:
              'MetaMask example snap demonstrating the use of the `onStart`, `onInstall`, and `onUpdate` lifecycle hooks.',
            initialPermissions: {
              'endowment:lifecycle-hooks': {},
              snap_dialog: {},
            },
            manifestVersion: '0.1',
            platformVersion: '8.1.0',
            proposedName: 'Lifecycle Hooks Example Snap',
            repository: {
              type: 'git',
              url: 'https://github.com/MetaMask/snaps.git',
            },
            source: {
              location: {
                npm: {
                  filePath: 'dist/bundle.js',
                  packageName: '@metamask/lifecycle-hooks-example-snap',
                  registry: 'https://registry.npmjs.org',
                },
              },
              shasum: '5tlM5E71Fbeid7I3F0oQURWL7/+0620wplybtklBCHQ=',
            },
            version: '2.2.0',
          },
          sourceCode:
            // eslint-disable-next-line no-template-curly-in-string
            '(()=>{var e={d:(n,t)=>{for(var a in t)e.o(t,a)&&!e.o(n,a)&&Object.defineProperty(n,a,{enumerable:!0,get:t[a]})},o:(e,n)=>Object.prototype.hasOwnProperty.call(e,n),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},n={};(()=>{"use strict";function t(e,n,t){if("string"==typeof e)throw new Error(`An HTML element ("${String(e)}") was used in a Snap component, which is not supported by Snaps UI. Please use one of the supported Snap components.`);if(!e)throw new Error("A JSX fragment was used in a Snap component, which is not supported by Snaps UI. Please use one of the supported Snap components.");return e({...n,key:t})}function a(e){return Object.fromEntries(Object.entries(e).filter((([,e])=>void 0!==e)))}function r(e){return n=>{const{key:t=null,...r}=n;return{type:e,props:a(r),key:t}}}e.r(n),e.d(n,{onInstall:()=>p,onStart:()=>l,onUpdate:()=>d});const o=r("Box"),s=r("Text"),l=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The client was started successfully, and the "onStart" handler was called.\'})})}}),p=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The Snap was installed successfully, and the "onInstall" handler was called.\'})})}}),d=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The Snap was updated successfully, and the "onUpdate" handler was called.\'})})}})})(),module.exports=n})();',
          status: 'stopped',
          version: '2.2.0',
          versionHistory: [
            {
              date: 1750244439310,
              origin: 'https://metamask.github.io',
              version: '2.2.0',
            },
          ],
        },
      },
    });
  }

  withBackupAndSyncSettings(options = {}) {
    const {
      isProfileSyncingEnabled = true,
      isAccountSyncingEnabled = true,
      isProfileSyncingUpdateLoading = false,
      isAccountSyncingUpdateLoading = false,
      hasAccountSyncingSyncedAtLeastOnce = false,
    } = options;

    merge(this.fixture.data.UserStorageController, {
      isProfileSyncingEnabled,
      isAccountSyncingEnabled,
      isProfileSyncingUpdateLoading,
      isAccountSyncingUpdateLoading,
      hasAccountSyncingSyncedAtLeastOnce,
    });
    return this;
  }

  build() {
    this.fixture.meta = {
      version: FIXTURE_STATE_METADATA_VERSION,
    };
    return this.fixture;
  }
}

module.exports = FixtureBuilder;
