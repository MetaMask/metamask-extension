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
                'eth_signTransaction',
                'eth_signTypedData_v1',
                'eth_signTypedData_v3',
                'eth_signTypedData_v4',
              ],
              type: 'eip155:eoa',
              scopes: ['eip155:0'],
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
          '{"data":"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","iv":"c1SH4o6o7SCLwUoYgxH7Dg==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"FelvUyr3fuqEBFNPQmVwYNbRSCAsgSFl9zGt7AWE8y8="}',
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
      config: {},
      firstTimeInfo: {
        date: 1665507600000,
        version: '10.21.0',
      },
    },
  };
}

module.exports = { defaultFixture, FIXTURE_STATE_METADATA_VERSION, E2E_SRP };
