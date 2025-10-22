const { mockNetworkStateOld } = require('../../stub/networks');
const { CHAIN_IDS } = require('../../../shared/constants/network');
const { FirstTimeFlowType } = require('../../../shared/constants/onboarding');

// TODO: Should we bump this?
// The e2e tests currently configure state in the schema of migration 74.
// This requires us to specify network state in the old schema, so it can run through the migrations.
// We could bump this to latest, but it breaks too many other things to handle right now.
const FIXTURE_STATE_METADATA_VERSION = 74;

const E2E_SRP =
  'spread raise short crane omit tent fringe mandate neglect detail suspect cradle';

function defaultFixture(inputChainId = CHAIN_IDS.LOCALHOST) {
  return {
    data: {
      AuthenticationController: {
        isSignedIn: true,
      },
      NotificationServicesController: {
        subscriptionAccountsSeen: [],
        isFeatureAnnouncementsEnabled: false,
        isNotificationServicesEnabled: false,
        isMetamaskNotificationsFeatureSeen: false,
        metamaskNotificationsList: [],
        metamaskNotificationsReadList: [],
      },
      AccountTreeController: {
        accountTree: {
          wallets: {
            'entropy:01JNGTRZ3QCEEQ7GYYFXBSQSBK': {
              type: 'entropy',
              id: 'entropy:01JNGTRZ3QCEEQ7GYYFXBSQSBK',
              metadata: {
                name: 'Wallet 1',
                entropy: {
                  id: '01JNGTRZ3QCEEQ7GYYFXBSQSBK',
                },
              },
              status: 'ready',
              groups: {
                'entropy:01JNGTRZ3QCEEQ7GYYFXBSQSBK/0': {
                  type: 'multichain-account',
                  id: 'entropy:01JNGTRZ3QCEEQ7GYYFXBSQSBK/0',
                  metadata: {
                    name: 'Account 1',
                    pinned: false,
                    hidden: false,
                    entropy: {
                      groupIndex: 0,
                    },
                  },
                  accounts: [
                    'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
                    '7be38d47-4dba-430e-9463-c7d84659fb2e',
                  ],
                },
              },
            },
            'entropy:01JNGTTNRVYNQVN5FN8YTFAMJ4': {
              type: 'entropy',
              id: 'entropy:01JNGTTNRVYNQVN5FN8YTFAMJ4',
              metadata: {
                name: 'Wallet 2',
                entropy: {
                  id: '01JNGTTNRVYNQVN5FN8YTFAMJ4',
                },
              },
              status: 'ready',
              groups: {
                'entropy:01JNGTTNRVYNQVN5FN8YTFAMJ4/0': {
                  type: 'multichain-account',
                  id: 'entropy:01JNGTTNRVYNQVN5FN8YTFAMJ4/0',
                  metadata: {
                    name: 'Account 2',
                    pinned: false,
                    hidden: false,
                    entropy: {
                      groupIndex: 0,
                    },
                  },
                  accounts: ['0c5d843d-5105-413d-b40a-cd8b6415a49c'],
                },
              },
            },
          },
          selectedAccountGroup: 'entropy:01JNGTRZ3QCEEQ7GYYFXBSQSBK/0',
        },
      },
      AccountsController: {
        internalAccounts: {
          selectedAccount: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
          accounts: {
            'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
              id: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
              address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              options: {
                entropySource: '01JNGTRZ3QCEEQ7GYYFXBSQSBK',
                derivationPath: "m/44'/60'/0'/0/0",
                groupIndex: 0,
                entropy: {
                  type: 'mnemonic',
                  id: '01JNGTRZ3QCEEQ7GYYFXBSQSBK',
                  derivationPath: "m/44'/60'/0'/0/0",
                  groupIndex: 0,
                },
              },
              methods: [
                'personal_sign',
                'eth_sign',
                'eth_signTransaction',
                'eth_signTypedData_v1',
                'eth_signTypedData_v3',
                'eth_signTypedData_v4',
              ],
              scopes: ['eip155:0'],
              type: 'eip155:eoa',
              metadata: {
                name: 'Account 1',
                importTime: 1761093330346,
                lastSelected: 1761093448033,
                keyring: {
                  type: 'HD Key Tree',
                },
              },
            },
            '0c5d843d-5105-413d-b40a-cd8b6415a49c': {
              id: '0c5d843d-5105-413d-b40a-cd8b6415a49c',
              address: '0xc6d5a3c98ec9073b54fa0969957bd582e8d874bf',
              options: {
                entropySource: '01JNGTTNRVYNQVN5FN8YTFAMJ4',
                derivationPath: "m/44'/60'/0'/0/0",
                groupIndex: 0,
                entropy: {
                  type: 'mnemonic',
                  id: '01JNGTTNRVYNQVN5FN8YTFAMJ4',
                  derivationPath: "m/44'/60'/0'/0/0",
                  groupIndex: 0,
                },
              },
              methods: [
                'personal_sign',
                'eth_sign',
                'eth_signTransaction',
                'eth_signTypedData_v1',
                'eth_signTypedData_v3',
                'eth_signTypedData_v4',
              ],
              scopes: ['eip155:0'],
              type: 'eip155:eoa',
              metadata: {
                name: 'Account 2',
                importTime: 1761093331303,
                lastSelected: 0,
                keyring: {
                  type: 'HD Key Tree',
                },
              },
            },
            '7be38d47-4dba-430e-9463-c7d84659fb2e': {
              type: 'solana:data-account',
              id: '7be38d47-4dba-430e-9463-c7d84659fb2e',
              address: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              options: {
                scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
                entropySource: '01JNGTRZ3QCEEQ7GYYFXBSQSBK',
                derivationPath: "m/44'/501'/0'/0'",
                index: 0,
                entropy: {
                  type: 'mnemonic',
                  id: '01JNGTRZ3QCEEQ7GYYFXBSQSBK',
                  groupIndex: 0,
                  derivationPath: "m/44'/501'/0'/0'",
                },
              },
              methods: [
                'signAndSendTransaction',
                'signTransaction',
                'signMessage',
                'signIn',
              ],
              scopes: [
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
                'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
                'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
              ],
              metadata: {
                name: 'Solana 1',
                importTime: 1761093334044,
                keyring: {
                  type: 'Snap Keyring',
                },
                snap: {
                  id: 'npm:@metamask/solana-wallet-snap',
                  name: 'Solana',
                  enabled: true,
                },
                lastSelected: 1761093334047,
                nameLastUpdatedAt: 1761093334047,
              },
            },
          },
          selectedAccount: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
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
          8: {
            date: '2021-11-01',
            id: 8,
            isShown: false,
          },
        },
      },
      NetworkOrderController: {
        orderedNetworkList: [
          {
            networkId: '0x1',
            networkRpcUrl:
              'https://mainnet.infura.io/v3/00000000000000000000000000000000',
          },
          {
            networkId: '0xe708',
            networkRpcUrl:
              'https://linea-mainnet.infura.io/v3/00000000000000000000000000000000',
          },
          {
            networkId: inputChainId,
            networkRpcUrl: 'http://localhost:8545',
          },
        ],
      },
      NetworkEnablementController: {
        enabledNetworkMap: {
          eip155: {
            [inputChainId]: true,
          },
          solana: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
          },
        },
      },
      AccountOrderController: {
        pinnedAccountList: [],
        hiddenAccountList: [],
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
        recoveryPhraseReminderHasBeenShown: true,
        pna25Acknowledged: false,
        recoveryPhraseReminderLastShown:
          '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds',
        showTestnetMessageInDropdown: true,
        trezorModel: null,
        isRampCardClosed: false,
        newPrivacyPolicyToastClickedOrClosed: true,
        newPrivacyPolicyToastShownDate: Date.now(),
        snapsInstallPrivacyWarningShown: true,
        hasShownMultichainAccountsIntroModal: true,
        showShieldEntryModalOnce: false,
        pendingShieldCohort: null,
        pendingShieldCohortTxType: null,
        appActiveTab: {
          id: 1,
          title: 'E2E Test Dapp',
          origin: 'http://127.0.0.1:8080',
          protocol: 'http:',
          url: 'http://127.0.0.1:8080',
          host: '127.0.0.1:8080',
          href: 'http://127.0.0.1:8080',
        },
      },
      BridgeController: {},
      CurrencyController: {
        currentCurrency: 'usd',
        currencyRates: {
          ETH: {
            conversionDate: 1665507600.0,
            conversionRate: 1700.0,
            usdConversionRate: 1700.0,
          },
          MON: {
            conversionDate: 1665507600.0,
            conversionRate: 0.2,
            usdConversionRate: 0.2,
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
          '{"data":"WHaP1FrrtV4zUonudIppDifsLHF39g6oPkVksAIdWAHBRzax1uy1asfAJprR7u72t4/HuYz5yPIFQrnNnv+hwQu9GRuty88VKMnvMy+sq8MNtoXI+C54bZpWa8r4iUQfa0Mj/cfJbpFpzOdF1ZYXahTfTcU5WsrHwvJew842CiJR4B2jmCHHXfm/DxLK3WazsVQwXJGx/U71UelGoOOrT8NI28EKrAwgPn+7Xmv0j92gmhau30N7Bo2fr6Zv","iv":"LfD8/tY1EjXzxuemSmDVdA==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"nk4xdpmMR+1s5BYe4Vnk++XAQwrISI2bCtbMg7V1wUA="}',
      },
      MetaMetricsController: {
        eventsBeforeMetricsOptIn: [],
        tracesBeforeMetricsOptIn: [],
        fragments: {},
        metaMetricsId: null,
        participateInMetaMetrics: false,
        dataCollectionForMarketing: false,
        traits: {},
        latestNonAnonymousEventTimestamp: 0,
      },
      MetaMetricsDataDeletionController: {
        metaMetricsDataDeletionId: null,
        metaMetricsDataDeletionTimestamp: 0,
      },
      NetworkController: {
        ...mockNetworkStateOld({
          id: 'networkConfigurationId',
          chainId: inputChainId,
          nickname: 'Localhost 8545',
          rpcUrl: 'http://localhost:8545',
          ticker: 'ETH',
          blockExplorerUrl: undefined,
        }),
        providerConfig: { id: 'networkConfigurationId' },
      },
      OnboardingController: {
        completedOnboarding: true,
        firstTimeFlowType: FirstTimeFlowType.import,
        onboardingTabs: {},
        seedPhraseBackedUp: true,
      },
      PermissionController: {
        subjects: {},
      },
      PreferencesController: {
        advancedGasFee: null,
        currentLocale: 'en',
        useExternalServices: true,
        dismissSeedBackUpReminder: true,
        overrideContentSecurityPolicyHeader: true,
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
          showExtensionInFullSizeView: false,
          showFiatInTestnets: false,
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
          shouldShowAggregatedBalancePopover: true,
          tokenNetworkFilter: {},
          avatarType: 'maskicon',
        },
        selectedAddress: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        theme: 'light',
        useBlockie: false,
        useNftDetection: false,
        usePhishDetect: true,
        useTokenDetection: false,
        useCurrencyRateCheck: true,
        useMultiAccountBalanceChecker: true,
        isMultiAccountBalancesEnabled: true,
        referrals: {
          hyperliquid: {},
        },
      },
      SelectedNetworkController: {
        domains: {},
      },
      SmartTransactionsController: {
        smartTransactionsState: {
          fees: {},
          feesByChainId: {},
          liveness: true,
          livenessByChainId: {},
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
      },
      MultichainAccountService: {},
      TransactionController: {
        transactions: {},
      },
      ProfileMetricsController: {
        initialEnqueueCompleted: false,
        syncQueue: {},
      },
      config: {},
      firstTimeInfo: {
        date: 1665507600000,
        version: '10.21.0',
      },
    },
  };
}

module.exports = { defaultFixture, FIXTURE_STATE_METADATA_VERSION, E2E_SRP };
