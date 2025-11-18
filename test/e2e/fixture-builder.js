const {
  WALLET_SNAP_PERMISSION_KEY,
  SnapCaveatType,
} = require('@metamask/snaps-utils');
const { merge, mergeWith } = require('lodash');
const { toHex } = require('@metamask/controller-utils');
const { mockNetworkStateOld } = require('../stub/networks');

const {
  AVALANCHE_DISPLAY_NAME,
  BNB_DISPLAY_NAME,
  CHAIN_IDS,
  LOCALHOST_DISPLAY_NAME,
  POLYGON_DISPLAY_NAME,
  ZK_SYNC_ERA_DISPLAY_NAME,
} = require('../../shared/constants/network');
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
const onboardingFixtureJson = require('./fixtures/onboarding-fixture.json');

function onboardingFixture() {
  return onboardingFixtureJson;
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
    this.fixture.data.NetworkEnablementController.enabledNetworkMap = data;
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

  withKeyringThirtyAccounts() {
    return this.withKeyringController({
      vault:
        '{"data":"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","iv":"FwRUZ/q7Bpie81F4PYyMxQ==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"A0UlIvcNTzhj/3ZpVOgfBzAa0SIGa8mYVl0lU5saMxY="}',
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
          nickname: BNB_DISPLAY_NAME,
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

  withNetworkControllerOnArbitrumGoerli() {
    return this.withNetworkController({
      selectedNetworkClientId: 'arbitrum-goerli',
    });
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
          nickname: LOCALHOST_DISPLAY_NAME,
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
          nickname: LOCALHOST_DISPLAY_NAME,
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
          nickname: POLYGON_DISPLAY_NAME,
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

  withNetworkControllerOnSei() {
    return this.withNetworkController({
      selectedNetworkClientId: 'sei',
      networkConfigurations: {
        sei: {
          chainId: CHAIN_IDS.SEI,
          nickname: 'Sei',
          rpcUrl: 'https://sei-mainnet.infura.io/v3/',
          ticker: 'SEI',
          rpcPrefs: {
            blockExplorerUrl: 'https://seitrace.com',
          },
          id: 'sei',
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
    const optionalScopes = {};

    for (const scope of scopes) {
      optionalScopes[scope] = {
        accounts: [
          `${scope}:0x5cfe73b6021e818b776b421b1c4db2474086a7e1`,
          `${scope}:0x09781764c08de8ca82e156bbf156a3ca217c7950`,
        ],
      };
    }

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
   * Note: When using this method, you also need to disable the smart transactions
   * migration in your test by adding the following manifest flag:
   * ```
   * manifestFlags: {
   *   testing: { disableSmartTransactionsOverride: true },
   * }
   * ```
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

  /**
   * Configure the Account Tree Controller state.
   * Builds a BIP-44 compliant tree by grouping HD accounts by entropy source
   * (primary HD keyring ID) into entropy wallets, and non-HD accounts by
   * keyring/snap into single-account groups.
   *
   * @param {object} [data] - Optional overrides to merge into the default state.
   * @param {object} [data.accountTree] - Account tree structure to set.
   * @param {object} [data.accountGroupsMetadata] - Per-group metadata map.
   * @param {object} [data.accountWalletsMetadata] - Per-wallet metadata map.
   * @returns {FixtureBuilder}
   */
  withAccountTreeController(data = {}) {
    const buildDefaultAccountTree = () => {
      const accountsById =
        this.fixture?.data?.AccountsController?.internalAccounts?.accounts ||
        {};
      const selectedAccountId =
        this.fixture?.data?.AccountsController?.internalAccounts
          ?.selectedAccount || null;
      const accountsList = Object.values(accountsById);

      const wallets = {};

      // 1) Entropy (HD) wallets grouped by entropySource, defaulting to BIP-44 account index 0
      const entropyToAccountIds = {};
      for (const account of accountsList) {
        const keyringType = account?.metadata?.keyring?.type;
        if (keyringType === 'HD Key Tree') {
          const entropyId =
            account?.options?.entropySource || 'UNKNOWN_ENTROPY_SOURCE';
          if (!entropyToAccountIds[entropyId]) {
            entropyToAccountIds[entropyId] = [];
          }
          entropyToAccountIds[entropyId].push(account.id);
        }
      }

      Object.entries(entropyToAccountIds).forEach(
        ([entropyId, accountIds], index) => {
          const walletId = `entropy:${entropyId}`;
          const groupId = `${walletId}/0`;
          wallets[walletId] = {
            id: walletId,
            type: 'entropy',
            groups: {
              [groupId]: {
                id: groupId,
                type: 'multichain-account',
                accounts: accountIds,
                metadata: {
                  name: 'Default',
                  pinned: false,
                  hidden: false,
                  entropy: { groupIndex: 0 },
                },
              },
            },
            metadata: {
              name: `Wallet ${index + 1}`,
              entropy: { id: entropyId },
            },
          };
        },
      );

      // 2) Keyring wallets (Ledger, Trezor, Simple Key Pair, Custody, etc.)
      for (const account of accountsList) {
        const keyringType = account?.metadata?.keyring?.type;
        const isHd = keyringType === 'HD Key Tree';
        const isSnap = Boolean(account?.metadata?.snap?.id);
        if (!isHd && keyringType && !isSnap) {
          const walletId = `keyring:${keyringType}`;
          const lowerAddress = (account?.address || '').toLowerCase();
          const groupId = `${walletId}/${lowerAddress}`;
          wallets[walletId] ||= {
            id: walletId,
            type: 'keyring',
            groups: {},
            metadata: { name: keyringType, keyring: { type: keyringType } },
          };
          wallets[walletId].groups[groupId] = {
            id: groupId,
            type: 'single-account',
            accounts: [account.id],
            metadata: {
              name: `${keyringType} Account 1`,
              pinned: false,
              hidden: false,
            },
          };
        }
      }

      // 3) Snap wallets grouped by snap id into single-account groups
      for (const account of accountsList) {
        const snapId = account?.metadata?.snap?.id;
        if (snapId) {
          const walletId = `snap:${snapId}`;
          const lowerAddress = (account?.address || '').toLowerCase();
          const groupId = `${walletId}/${lowerAddress}`;
          wallets[walletId] ||= {
            id: walletId,
            type: 'snap',
            groups: {},
            metadata: {
              name: account?.metadata?.snap?.name || snapId,
              snap: { id: snapId },
            },
          };
          wallets[walletId].groups[groupId] = {
            id: groupId,
            type: 'single-account',
            accounts: [account.id],
            metadata: {
              name: `${account?.metadata?.snap?.name || 'Snap Account'} 1`,
              pinned: false,
              hidden: false,
            },
          };
        }
      }

      // Determine selectedAccountGroup: group containing selected internal account
      let selectedAccountGroup = null;
      if (selectedAccountId) {
        for (const wallet of Object.values(wallets)) {
          const match = Object.values(wallet.groups).find((group) =>
            group.accounts.includes(selectedAccountId),
          );
          if (match) {
            selectedAccountGroup = match.id;
            break;
          }
        }
      }

      // Fallback: select the first available group
      if (!selectedAccountGroup) {
        const firstWallet = Object.values(wallets)[0];
        const firstGroup = firstWallet
          ? Object.values(firstWallet.groups)[0]
          : null;
        selectedAccountGroup = firstGroup ? firstGroup.id : null;
      }

      return { selectedAccountGroup, wallets };
    };

    this.fixture.data.AccountTreeController ??= {};

    const defaultState = {
      accountTree: buildDefaultAccountTree(),
      accountGroupsMetadata: {},
      accountWalletsMetadata: {},
    };

    // Allow callers to override/extend defaults.
    merge(defaultState, data);
    merge(this.fixture.data.AccountTreeController, defaultState);
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
      accountsByChainId: {
        '0x539': {
          '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1': {
            balance: '0x15af1d78b58c40000',
          },
          '0xF68464152d7289D7eA9a2bEC2E0035c45188223c': {
            balance: '0x100000000000000000000',
          },
        },
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
        'avalanche-mainnet': {
          chainId: CHAIN_IDS.AVALANCHE,
          nickname: AVALANCHE_DISPLAY_NAME,
          rpcPrefs: {},
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
          ticker: 'AVAX',
          id: 'avalanche-mainnet',
        },
        'zksync-mainnet': {
          chainId: CHAIN_IDS.ZKSYNC_ERA,
          nickname: ZK_SYNC_ERA_DISPLAY_NAME,
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
      isBackupAndSyncEnabled = true,
      isAccountSyncingEnabled = true,
      isBackupAndSyncUpdateLoading = false,
    } = options;

    merge(this.fixture.data.UserStorageController, {
      isBackupAndSyncEnabled,
      isAccountSyncingEnabled,
      isBackupAndSyncUpdateLoading,
    });
    return this;
  }

  withRemoteFeatureFlags(remoteFeatureFlags = {}) {
    merge(
      this.fixture.data.RemoteFeatureFlagController.remoteFeatureFlags,
      remoteFeatureFlags,
    );
    return this;
  }

  build() {
    if (!this.fixture.meta) {
      this.fixture.meta = {
        version: FIXTURE_STATE_METADATA_VERSION,
      };
    }
    return this.fixture;
  }
}

module.exports = FixtureBuilder;
