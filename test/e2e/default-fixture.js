const {
  ETHERSCAN_SUPPORTED_CHAIN_IDS,
} = require('@metamask/preferences-controller');
const { mockNetworkStateOld } = require('../stub/networks');
const { CHAIN_IDS } = require('../../shared/constants/network');
const { FirstTimeFlowType } = require('../../shared/constants/onboarding');

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
        sessionData: {},
      },
      UserStorageController: {
        hasAccountSyncingSyncedAtLeastOnce: true,
        isProfileSyncingEnabled: true,
      },
      NotificationServicesController: {
        isFeatureAnnouncementsEnabled: false,
        isMetamaskNotificationsFeatureSeen: false,
        isNotificationServicesEnabled: false,
        metamaskNotificationsList: [],
        metamaskNotificationsReadList: [],
        subscriptionAccountsSeen: [],
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
            networkId: '0x539',
            networkRpcUrl: 'http://localhost:8545',
          },
        ],
      },
      AccountOrderController: {
        hiddenAccountList: [],
        pinnedAccountList: [],
      },
      AppStateController: {
        browserEnvironment: {},
        connectedStatusPopoverHasBeenShown: true,
        defaultHomeActiveTabName: null,
        hadAdvancedGasFeesSetPriorToMigration92_3: false,
        lastViewedUserSurvey: '',
        newPrivacyPolicyToastClickedOrClosed: true,
        newPrivacyPolicyToastShownDate: Date.now(),
        nftsDetectionNoticeDismissed: true,
        onboardingDate: Date.now(),
        outdatedBrowserWarningLastShown: false,
        recoveryPhraseReminderHasBeenShown: true,
        recoveryPhraseReminderLastShown:
          '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds',
        showAccountBanner: false,
        showBetaHeader: false,
        showNetworkBanner: false,
        showPermissionsTour: false,
        showTestnetMessageInDropdown: true,
        slides: [],
        surveyLinkLastClickedOrClosed: '',
        switchedNetworkNeverShowMessage: false,
        termsOfUseLastAgreed:
          '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds',
        timeoutMinutes: '',
        trezorModel: null,
      },
      BridgeController: {
        bridgeState: {
          bridgeFeatureFlags: {
            extensionConfig: {
              support: false,
              chains: {
                '0x1': {
                  isActiveSrc: true,
                  isActiveDest: true,
                },
                '0xa': {
                  isActiveSrc: true,
                  isActiveDest: true,
                },
                '0xe708': {
                  isActiveSrc: true,
                  isActiveDest: true,
                },
              },
            },
          },
          destTokens: {},
          destTopAssets: [],
        },
      },
      CurrencyController: {
        currencyRates: {
          ETH: {
            conversionDate: 1665507600.0,
            conversionRate: 1700.0,
            usdConversionRate: 1700.0,
          },
        },
        currentCurrency: 'usd',
      },
      GasFeeController: {
        estimatedGasFeeTimeBounds: {},
        gasEstimateType: 'none',
        gasFeeEstimates: {},
        gasFeeEstimatesByChainId: {},
        nonRPCGasFeeApisDisabled: false,
      },
      KeyringController: {
        vault:
          '{"data":"WHaP1FrrtV4zUonudIppDifsLHF39g6oPkVksAIdWAHBRzax1uy1asfAJprR7u72t4/HuYz5yPIFQrnNnv+hwQu9GRuty88VKMnvMy+sq8MNtoXI+C54bZpWa8r4iUQfa0Mj/cfJbpFpzOdF1ZYXahTfTcU5WsrHwvJew842CiJR4B2jmCHHXfm/DxLK3WazsVQwXJGx/U71UelGoOOrT8NI28EKrAwgPn+7Xmv0j92gmhau30N7Bo2fr6Zv","iv":"LfD8/tY1EjXzxuemSmDVdA==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"nk4xdpmMR+1s5BYe4Vnk++XAQwrISI2bCtbMg7V1wUA="}',
      },
      MetaMetricsController: {
        dataCollectionForMarketing: false,
        eventsBeforeMetricsOptIn: [],
        fragments: {},
        latestNonAnonymousEventTimestamp: 0,
        marketingCampaignCookieId: null,
        metaMetricsId: '',
        participateInMetaMetrics: false,
        previousUserTraits: {},
        segmentApiCalls: {},
        traits: {},
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
        seedPhraseBackedUp: true,
      },
      PermissionController: {
        subjects: {},
      },
      PreferencesController: {
        addSnapAccountEnabled: false,
        advancedGasFee: {},
        bitcoinSupportEnabled: false,
        bitcoinTestnetSupportEnabled: false,
        currentLocale: 'en',
        dismissSeedBackUpReminder: true,
        enableMV3TimestampSave: true,
        featureFlags: {},
        forgottenPassword: false,
        identities: {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
            address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            lastSelected: 1665507600000,
            name: 'Account 1',
          },
        },
        incomingTransactionsPreferences: {},
        ipfsGateway: 'dweb.link',
        isIpfsGatewayEnabled: true,
        isMultiAccountBalancesEnabled: true,
        knownMethodData: {},
        ledgerTransportType: 'webhid',
        lostIdentities: {},
        openSeaEnabled: false,
        overrideContentSecurityPolicyHeader: true,
        preferences: {
          hideZeroBalanceTokens: false,
          showExtensionInFullSizeView: false,
          showFiatInTestnets: false,
          showTestNetworks: false,
          smartTransactionsOptInStatus: true,
          showNativeTokenAsMainBalance: true,
          petnamesEnabled: true,
          showMultiRpcModal: false,
          isRedesignedConfirmationsDeveloperEnabled: false,
          showConfirmationAdvancedDetails: false,
          tokenSortConfig: {
            key: 'tokenFiatAmount',
            order: 'dsc',
            sortCallback: 'stringNumeric',
          },
          shouldShowAggregatedBalancePopover: true,
          tokenNetworkFilter: {},
        },
        securityAlertsEnabled: true,
        selectedAddress: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
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
        },
        snapRegistryList: {},
        snapsAddSnapAccountModalDismissed: true,
        theme: 'light',
        use4ByteResolution: true,
        useAddressBarEnsResolution: true,
        useBlockie: false,
        useCurrencyRateCheck: true,
        useExternalNameSources: true,
        useExternalServices: true,
        useMultiAccountBalanceChecker: true,
        useNftDetection: false,
        useNonceField: false,
        usePhishDetect: true,
        useRequestQueue: true,
        useSafeChainsListValidation: true,
        useTokenDetection: false,
        useTransactionSimulations: false,
        watchEthereumAccountEnabled: false,
      },
      QueuedRequestController: {
        queuedRequestCount: 0,
      },
      SelectedNetworkController: {
        domains: {},
      },
      SmartTransactionsController: {},
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
        lastFetchedBlockNumbers: {},
        methodData: {},
        submitHistory: [],
        transactions: [],
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
