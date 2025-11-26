const fixture = {
  AccountOrderController: {
    pinnedAccountList: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
    hiddenAccountList: ['0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b'],
  },
  AccountTracker: {
    accounts: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        balance: '0x0',
      },
    },
    accountsByChainId: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          balance: '0x0',
        },
      },
    },
    currentBlockGasLimit: '',
    currentBlockGasLimitByChainId: {
      '0x1': '0x0',
    },
  },
  AccountTreeController: {
    accountTree: {
      group1: {},
    },
  },
  AccountsController: {
    internalAccounts: {
      accounts: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          id: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          metadata: {
            name: 'Account 1',
            keyring: {
              type: 'HD Key Tree',
            },
          },
        },
      },
      selectedAccount: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    },
  },
  AddressBookController: {
    addressBook: {
      '0x5': {
        '0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
          address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          chainId: '0x5',
          isEns: false,
          memo: '',
          name: 'Test Contact',
        },
      },
    },
  },
  AlertController: {
    alertEnabledness: {
      unconnectedAccount: true,
    },
    unconnectedAccountAlertShownOrigins: {
      'https://example.com': true,
    },
    web3ShimUsageOrigins: {
      'https://example.com': true,
    },
  },
  AnnouncementController: {
    announcements: {
      'announcement-1': {
        id: 'announcement-1',
        date: 1609459200000,
      },
    },
  },
  AppMetadataController: {
    currentAppVersion: '',
    currentMigrationVersion: 0,
    previousAppVersion: '',
    previousMigrationVersion: 0,
  },
  AppStateController: {
    browserEnvironment: {
      browser: 'chrome',
      os: 'mac',
    },
    connectedStatusPopoverHasBeenShown: false,
    currentPopupId: 'popup-1',
    onboardingDate: 0,
    currentExtensionPopupId: 'ext-popup-1',
    defaultHomeActiveTabName: null,
    enableEnforcedSimulations: false,
    enableEnforcedSimulationsForTransactions: {
      '0x1': false,
    },
    fullScreenGasPollTokens: {
      token1: true,
    },
    hadAdvancedGasFeesSetPriorToMigration92_3: false,
    canTrackWalletFundsObtained: false,
    isRampCardClosed: false,
    nftsDetectionNoticeDismissed: false,
    nftsDropdownState: {
      '0x1': {},
    },
    notificationGasPollTokens: {
      token1: true,
    },
    outdatedBrowserWarningLastShown: 0,
    popupGasPollTokens: {
      token1: true,
    },
    activeQrCodeScanRequest: null,
    recoveryPhraseReminderHasBeenShown: false,
    recoveryPhraseReminderLastShown: 0,
    showBetaHeader: false,
    productTour: {
      step: 'welcome',
    },
    showPermissionsTour: false,
    showNetworkBanner: false,
    showAccountBanner: false,
    showTestnetMessageInDropdown: false,
    surveyLinkLastClickedOrClosed: 0,
    snapsInstallPrivacyWarningShown: false,
    termsOfUseLastAgreed: 0,
    throttledOrigins: {
      'https://example.com': 1609459200000,
    },
    timeoutMinutes: 0,
    trezorModel: null,
    isUpdateAvailable: false,
    updateModalLastDismissedAt: 0,
    lastUpdatedAt: 0,
    shieldEndingToastLastClickedOrClosed: 0,
    shieldPausedToastLastClickedOrClosed: 0,
  },
  ApprovalController: {
    approvalFlows: {
      flow1: {},
    },
    pendingApprovals: {
      approval1: {
        id: 'approval1',
        origin: 'https://example.com',
        type: 'transaction',
      },
    },
    pendingApprovalCount: 1,
  },
  AuthenticationController: {
    isSignedIn: false,
    srpSessionData: {
      sessionId: 'session1',
    },
  },
  BridgeController: {
    assetExchangeRates: {
      '0x1': {
        ETH: '2000',
      },
    },
    minimumBalanceForRentExemptionInLamports: '1000000',
    quoteRequest: {
      walletAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      slippage: 1,
      srcChainId: '0x1',
      destChainId: '0x5',
      destTokenAddress: '0x0000000000000000000000000000000000000000',
      srcTokenAmount: '1000000000000000000',
    },
    quotes: {
      quote1: {
        quoteId: 'quote1',
      },
    },
    quotesInitialLoadTime: 1609459200000,
    quotesLastFetched: 1609459200000,
    quotesLoadingStatus: 'idle',
    quoteFetchError: null,
    quotesRefreshCount: 1,
  },
  BridgeStatusController: {
    txHistory: {
      tx1: {
        id: 'tx1',
        status: 'pending',
      },
    },
  },
  CronjobController: {
    events: {
      event1: {
        id: 'event1',
        time: 1609459200000,
      },
    },
  },
  CurrencyController: {
    currentCurrency: 'usd',
    currencyRates: {
      ETH: {
        conversionDate: 1609459200000,
        conversionRate: 2000,
        usdConversionRate: 2000,
      },
    },
  },
  DecryptMessageController: {
    unapprovedDecryptMsgs: {
      msg1: {
        id: 'msg1',
        messageParams: {},
      },
    },
    unapprovedDecryptMsgCount: 1,
  },
  EncryptionPublicKeyController: {
    unapprovedEncryptionPublicKeyMsgs: {
      msg1: {
        id: 'msg1',
        messageParams: {},
      },
    },
    unapprovedEncryptionPublicKeyMsgCount: 1,
  },
  EnsController: {
    ensResolutionsByAddress: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 'test.eth',
    },
    ensEntries: {
      '0x1': {
        '.': {
          address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          chainId: '0x1',
          ensName: '.',
        },
      },
    },
  },
  GasFeeController: {
    estimatedGasFeeTimeBounds: {
      lowerTimeBound: 0,
      upperTimeBound: 60000,
    },
    gasEstimateType: 'fee-market',
    gasFeeEstimates: {
      low: {
        minWaitTimeEstimate: 180000,
        maxWaitTimeEstimate: 300000,
        suggestedMaxPriorityFeePerGas: '3',
        suggestedMaxFeePerGas: '53',
      },
    },
    gasFeeEstimatesByChainId: {
      '0x1': {
        gasEstimateType: 'fee-market',
        gasFeeEstimates: {
          low: {
            minWaitTimeEstimate: 180000,
            maxWaitTimeEstimate: 300000,
            suggestedMaxPriorityFeePerGas: '3',
            suggestedMaxFeePerGas: '53',
          },
        },
      },
    },
    nonRPCGasFeeApisDisabled: false,
  },
  KeyringController: {
    isUnlocked: false,
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
      },
    ],
  },
  LoggingController: {
    logs: [
      {
        id: 'log1',
        timestamp: 1609459200000,
        message: 'Test log',
      },
    ],
  },
  MetaMetricsController: {
    eventsBeforeMetricsOptIn: [
      {
        category: 'App',
        event: 'App Installed',
        properties: {},
      },
    ],
    tracesBeforeMetricsOptIn: [
      {
        request: {
          name: 'Test Trace',
          op: 'test.op',
          startTime: 1609459200000,
        },
        type: 'start',
      },
    ],
    fragments: {
      fragment1: {},
    },
    metaMetricsId:
      '0xf155e67a3c8fced8207d815fae1b5779092806929b590bd3f7a7cd1aaeab440e',
    participateInMetaMetrics: false,
    segmentApiCalls: [
      {
        event: 'test',
        timestamp: 1609459200000,
      },
    ],
    traits: {
      install_date_ext: '2025-01-01',
    },
    dataCollectionForMarketing: false,
    marketingCampaignCookieId: 'campaign1',
    latestNonAnonymousEventTimestamp: 1609459200000,
  },
  MetaMetricsDataDeletionController: {
    metaMetricsDataDeletionId: '',
    metaMetricsDataDeletionTimestamp: 0,
  },
  MultichainAssetsController: {
    accountsAssets: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x1': [],
      },
    },
    assetsMetadata: {
      '0x0000000000000000000000000000000000000000': {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
    },
    allIgnoredAssets: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x1': [],
      },
    },
  },
  MultichainAssetsRatesController: {
    assetsRates: {
      '0x0000000000000000000000000000000000000000': {
        '0x1': '2000',
      },
    },
  },
  MultichainBalancesController: {
    balances: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x1': '0x0',
      },
    },
  },
  MultichainRatesController: {
    fiatCurrency: 'usd',
    rates: {
      ETH: '2000',
    },
    cryptocurrencies: ['ETH'],
  },
  NameController: {
    names: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x1': 'test.eth',
      },
    },
    nameSources: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 'ens',
      },
    },
    useExternalNameSources: false,
  },
  NetworkController: {
    networkConfigurations: {
      mainnet: {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            type: 'infura',
            url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
          },
        ],
      },
    },
    networksMetadata: {
      mainnet: {
        EIPS: {},
        status: 'unknown',
      },
    },
    selectedNetworkClientId: 'mainnet',
  },
  NetworkEnablementController: {
    enabledNetworkMap: {
      eip155: {
        '0x1': true,
      },
    },
  },
  NetworkOrderController: {
    orderedNetworkList: ['mainnet'],
  },
  NftController: {
    allNftContracts: {
      '0x1': {
        '0x1234567890123456789012345678901234567890': {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '0x1',
          name: 'Test NFT',
        },
      },
    },
    allNfts: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [],
      },
    },
    ignoredNfts: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [],
      },
    },
  },
  NotificationServicesController: {
    subscriptionAccountsSeen: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': true,
    },
    isMetamaskNotificationsFeatureSeen: false,
    isNotificationServicesEnabled: false,
    isFeatureAnnouncementsEnabled: false,
    metamaskNotificationsList: {
      notification1: {
        id: 'notification1',
        read: false,
      },
    },
    metamaskNotificationsReadList: {
      notification1: true,
    },
    isCheckingAccountsPresence: false,
    isFetchingMetamaskNotifications: false,
    isUpdatingMetamaskNotifications: false,
    isUpdatingMetamaskNotificationsAccount: false,
  },
  NotificationServicesPushController: {
    fcmToken: '',
  },
  OnboardingController: {
    completedOnboarding: false,
    firstTimeFlowType: 'create',
    onboardingTabs: {
      tab1: true,
    },
    seedPhraseBackedUp: false,
  },
  PPOMController: {
    securityAlertsEnabled: false,
    storageMetadata: {
      metadata1: {
        version: '1.0.0',
      },
    },
    versionInfo: {
      version1: {
        version: '1.0.0',
      },
    },
  },
  PermissionController: {
    subjects: {
      'https://example.com': {
        origin: 'https://example.com',
        permissions: {
          eth_accounts: {},
        },
      },
    },
  },
  PermissionLogController: {
    permissionActivityLog: [
      {
        id: 'log1',
        timestamp: 1609459200000,
        method: 'eth_accounts',
      },
    ],
    permissionHistory: {
      'https://example.com': {
        eth_accounts: {
          accounts: {
            '0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1609459200000,
          },
        },
      },
    },
  },
  PhishingController: {},
  PreferencesController: {
    advancedGasFee: {
      gasPrice: '20000000000',
      maxFeePerGas: '30000000000',
      maxPriorityFeePerGas: '2000000000',
    },
    currentLocale: 'en',
    dismissSeedBackUpReminder: false,
    overrideContentSecurityPolicyHeader: false,
    featureFlags: {
      feature1: true,
    },
    forgottenPassword: false,
    identities: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        name: 'Account 1',
      },
    },
    isIpfsGatewayEnabled: false,
    ipfsGateway: 'dweb.link',
    knownMethodData: {
      '0xa9059cbb': {
        name: 'transfer',
        params: [],
      },
    },
    ledgerTransportType: 'u2f',
    lostIdentities: {
      '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
        address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
        name: 'Lost Account',
      },
    },
    openSeaEnabled: false,
    preferences: {
      autoLockTimeLimit: 0,
      hideZeroBalanceTokens: false,
      showExtensionInFullSizeView: false,
      showFiatInTestnets: false,
      showTestNetworks: false,
      smartTransactionsOptInStatus: '',
      tokenNetworkFilter: {
        '0x1': [],
      },
      showNativeTokenAsMainBalance: false,
      showConfirmationAdvancedDetails: false,
      privacyMode: false,
      avatarType: 'jazzicon',
    },
    useExternalServices: false,
    selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    snapRegistryList: {
      snap1: {
        id: 'snap1',
        name: 'Test Snap',
      },
    },
    theme: 'light',
    signatureSecurityAlertResponses: {
      alert1: 'approved',
    },
    addressSecurityAlertResponses: {
      address1: 'approved',
    },
    use4ByteResolution: false,
    useAddressBarEnsResolution: false,
    useBlockie: false,
    useCurrencyRateCheck: false,
    useMultiAccountBalanceChecker: false,
    useNftDetection: false,
    usePhishDetect: false,
    useTokenDetection: false,
    useTransactionSimulations: false,
    enableMV3TimestampSave: false,
  },
  RemoteFeatureFlagController: {
    remoteFeatureFlags: {
      feature1: {
        enabled: true,
      },
    },
    cacheTimestamp: 1609459200000,
  },
  RewardsController: {
    rewardsActiveAccount: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    rewardsAccounts: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {},
    },
    rewardsSubscriptions: {
      subscription1: {},
    },
    rewardsSeasons: {
      season1: {},
    },
    rewardsSeasonStatuses: {
      season1: 'active',
    },
    rewardsSubscriptionTokens: {
      token1: {},
    },
  },
  SelectedNetworkController: {
    domains: {
      'https://example.com': '0x1',
    },
  },
  SignatureController: {
    unapprovedPersonalMsgCount: 1,
    unapprovedPersonalMsgs: {
      msg1: {
        id: 'msg1',
        msgParams: {},
      },
    },
    unapprovedTypedMessages: {
      msg1: {
        id: 'msg1',
        msgParams: {},
      },
    },
    unapprovedTypedMessagesCount: 1,
  },
  SmartTransactionsController: {
    smartTransactionsState: {
      fees: {
        approvalTxFees: {
          fee1: '1000000000000000',
        },
        tradeTxFees: {
          fee1: '1000000000000000',
        },
      },
      liveness: false,
      smartTransactions: {
        tx1: {
          id: 'tx1',
          status: 'pending',
        },
      },
      userOptIn: false,
      userOptInV2: false,
    },
  },
  SnapController: {
    snaps: {
      'npm:@metamask/test-snap': {
        id: 'npm:@metamask/test-snap',
        version: '1.0.0',
        origin: 'npm:@metamask/test-snap',
      },
    },
  },
  SnapInsightsController: {
    insights: {
      insight1: {
        id: 'insight1',
        type: 'transaction',
      },
    },
  },
  SnapInterfaceController: {
    interfaces: {
      interface1: {
        id: 'interface1',
      },
    },
  },
  SnapsRegistry: {
    database: null,
    lastUpdated: 0,
    databaseUnavailable: false,
  },
  SubjectMetadataController: {
    subjectMetadata: {
      'https://example.com': {
        origin: 'https://example.com',
        name: 'Example',
        subjectType: 'website',
      },
    },
  },
  SwapsController: {
    swapsState: {
      approveTxId: 'tx1',
      customApproveTxData: null,
      customGasPrice: '20000000000',
      customMaxFeePerGas: '30000000000',
      customMaxGas: '21000',
      customMaxPriorityFeePerGas: '2000000000',
      errorKey: null,
      fetchParams: {
        param1: 'value1',
      },
      quotes: {
        quote1: {
          id: 'quote1',
        },
      },
      quotesLastFetched: 1609459200000,
      quotesPollingLimitEnabled: false,
      routeState: {
        route1: {},
      },
      saveFetchedQuotes: false,
      selectedAggId: 'agg1',
      swapsFeatureFlags: {
        feature1: true,
      },
      swapsFeatureIsLive: false,
      swapsQuotePrefetchingRefreshTime: 1609459200000,
      swapsQuoteRefreshTime: 1609459200000,
      swapsStxBatchStatusRefreshTime: 1609459200000,
      swapsStxStatusDeadline: 1609459200000,
      swapsStxGetTransactionsRefreshTime: 1609459200000,
      swapsStxMaxFeeMultiplier: 1.5,
      swapsUserFeeLevel: 'medium',
      tokens: {
        '0x0000000000000000000000000000000000000000': {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'ETH',
        },
      },
      topAggId: 'agg1',
      tradeTxId: 'tx1',
    },
  },
  TokenBalancesController: {
    tokenBalances: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x1': {
          '0x1234567890123456789012345678901234567890': '0x0',
        },
      },
    },
  },
  TokenDetectionController: {},
  TokenListController: {
    preventPollingOnNetworkRestart: false,
    tokensChainsCache: {
      '0x1': {
        timestamp: 1609459200000,
        data: {},
      },
    },
  },
  TokenRatesController: {
    marketData: {
      '0x1234567890123456789012345678901234567890': {
        '0x1': {
          price: '1.5',
        },
      },
    },
  },
  TokensController: {
    allDetectedTokens: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [],
      },
    },
    allIgnoredTokens: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [],
      },
    },
    allTokens: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
          {
            address: '0x1234567890123456789012345678901234567890',
            symbol: 'TEST',
            decimals: 18,
          },
        ],
      },
    },
  },
  TransactionController: {
    transactions: {
      tx1: {
        id: 'tx1',
        chainId: '0x1',
        status: 'confirmed',
        time: 1609459200000,
      },
    },
    lastFetchedBlockNumbers: {
      '0x1': '0x123456',
    },
    methodData: {
      '0xa9059cbb': {
        name: 'transfer',
        params: [],
      },
    },
  },
  TxController: {
    transactions: {
      tx1: {
        id: 'tx1',
        chainId: '0x1',
        status: 'confirmed',
        time: 1609459200000,
      },
    },
  },
  UserOperationController: {
    userOperations: {
      op1: {
        id: 'op1',
        chainId: '0x1',
        status: 'pending',
      },
    },
  },
  UserStorageController: {
    isBackupAndSyncEnabled: false,
    isBackupAndSyncUpdateLoading: false,
    isAccountSyncingEnabled: false,
    isContactSyncingEnabled: false,
  },
  appState: {
    customNonceValue: '1',
    isAccountMenuOpen: false,
    isNetworkMenuOpen: false,
    nextNonce: 1,
    pendingTokens: {
      token1: {
        address: '0x1234567890123456789012345678901234567890',
        symbol: 'TEST',
      },
    },
    welcomeScreenSeen: false,
    slides: [
      {
        id: 'slide1',
        seen: false,
      },
    ],
    confirmationExchangeRates: {
      ETH: '2000',
    },
  },
  gas: {
    customGasPrice: '20000000000',
  },
  history: {
    mostRecentOverviewPage: '/home',
  },
  metamask: {
    accountTree: {
      group1: {},
    },
    internalAccounts: {
      accounts: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          id: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          metadata: {
            name: 'Account 1',
            keyring: {
              type: 'HD Key Tree',
            },
          },
        },
      },
      selectedAccount: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    },
    accounts: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        balance: '0x0',
      },
    },
    accountsByChainId: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          balance: '0x0',
        },
      },
    },
    currentBlockGasLimit: '0x5208',
    currentBlockGasLimitByChainId: {
      '0x1': '0x5208',
    },
    addressBook: {
      '0x5': {
        '0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
          address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          chainId: '0x5',
          isEns: false,
          memo: '',
          name: 'Test Contact',
        },
      },
    },
    alertEnabledness: {
      unconnectedAccount: true,
    },
    unconnectedAccountAlertShownOrigins: {
      'https://example.com': true,
    },
    web3ShimUsageOrigins: {
      'https://example.com': true,
    },
    announcements: {
      'announcement-1': {
        id: 'announcement-1',
        date: 1609459200000,
      },
    },
    isSignedIn: false,
    srpSessionData: {
      sessionId: 'session1',
    },
    orderedNetworkList: ['mainnet'],
    enabledNetworkMap: {
      eip155: {
        '0x1': true,
      },
    },
    pinnedAccountList: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
    hiddenAccountList: ['0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b'],
    currentAppVersion: '13.6.0',
    currentMigrationVersion: 181,
    previousAppVersion: '13.5.0',
    previousMigrationVersion: 180,
    approvalFlows: {
      flow1: {},
    },
    pendingApprovals: {
      approval1: {
        id: 'approval1',
        origin: 'https://example.com',
        type: 'transaction',
      },
    },
    pendingApprovalCount: 1,
    browserEnvironment: {
      browser: 'chrome',
      os: 'mac',
    },
    connectedStatusPopoverHasBeenShown: false,
    currentPopupId: 'popup-1',
    onboardingDate: 1609459200000,
    currentExtensionPopupId: 'ext-popup-1',
    defaultHomeActiveTabName: null,
    enableEnforcedSimulations: false,
    enableEnforcedSimulationsForTransactions: {
      '0x1': false,
    },
    fullScreenGasPollTokens: {
      token1: true,
    },
    hadAdvancedGasFeesSetPriorToMigration92_3: false,
    canTrackWalletFundsObtained: false,
    isRampCardClosed: false,
    nftsDetectionNoticeDismissed: false,
    nftsDropdownState: {
      '0x1': {},
    },
    notificationGasPollTokens: {
      token1: true,
    },
    outdatedBrowserWarningLastShown: 1609459200000,
    popupGasPollTokens: {
      token1: true,
    },
    activeQrCodeScanRequest: null,
    recoveryPhraseReminderHasBeenShown: false,
    recoveryPhraseReminderLastShown: 1609459200000,
    showBetaHeader: false,
    productTour: {
      step: 'welcome',
    },
    showPermissionsTour: false,
    showNetworkBanner: false,
    showAccountBanner: false,
    showTestnetMessageInDropdown: false,
    surveyLinkLastClickedOrClosed: 1609459200000,
    snapsInstallPrivacyWarningShown: false,
    termsOfUseLastAgreed: 1609459200000,
    throttledOrigins: {
      'https://example.com': 1609459200000,
    },
    timeoutMinutes: 15,
    trezorModel: null,
    isUpdateAvailable: false,
    updateModalLastDismissedAt: 1609459200000,
    lastUpdatedAt: 1609459200000,
    shieldEndingToastLastClickedOrClosed: 1609459200000,
    shieldPausedToastLastClickedOrClosed: 1609459200000,
    balances: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x1': '0x0',
      },
    },
    accountsAssets: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x1': [],
      },
    },
    assetsMetadata: {
      '0x0000000000000000000000000000000000000000': {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
    },
    allIgnoredAssets: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x1': [],
      },
    },
    assetsRates: {
      '0x0000000000000000000000000000000000000000': {
        '0x1': '2000',
      },
    },
    assetExchangeRates: {
      '0x1': {
        ETH: '2000',
      },
    },
    minimumBalanceForRentExemptionInLamports: '1000000',
    quoteRequest: {
      walletAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      slippage: 1,
      srcChainId: '0x1',
      destChainId: '0x5',
      destTokenAddress: '0x0000000000000000000000000000000000000000',
      srcTokenAmount: '1000000000000000000',
    },
    quotes: {
      quote1: {
        quoteId: 'quote1',
      },
    },
    quotesInitialLoadTime: 1609459200000,
    quotesLastFetched: 1609459200000,
    quotesLoadingStatus: 'idle',
    quoteFetchError: null,
    quotesRefreshCount: 1,
    txHistory: {
      tx1: {
        id: 'tx1',
        status: 'pending',
      },
    },
    events: {
      event1: {
        id: 'event1',
        time: 1609459200000,
      },
    },
    currentCurrency: 'usd',
    currencyRates: {
      ETH: {
        conversionDate: 1609459200000,
        conversionRate: 2000,
        usdConversionRate: 2000,
      },
    },
    unapprovedDecryptMsgs: {
      msg1: {
        id: 'msg1',
        messageParams: {},
      },
    },
    unapprovedDecryptMsgCount: 1,
    unapprovedEncryptionPublicKeyMsgs: {
      msg1: {
        id: 'msg1',
        messageParams: {},
      },
    },
    unapprovedEncryptionPublicKeyMsgCount: 1,
    ensResolutionsByAddress: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 'test.eth',
    },
    ensEntries: {
      '0x1': {
        '.': {
          address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          chainId: '0x1',
          ensName: '.',
        },
      },
    },
    estimatedGasFeeTimeBounds: {
      lowerTimeBound: 0,
      upperTimeBound: 60000,
    },
    gasEstimateType: 'fee-market',
    gasFeeEstimates: {
      low: {
        minWaitTimeEstimate: 180000,
        maxWaitTimeEstimate: 300000,
        suggestedMaxPriorityFeePerGas: '3',
        suggestedMaxFeePerGas: '53',
      },
    },
    gasFeeEstimatesByChainId: {
      '0x1': {
        gasEstimateType: 'fee-market',
        gasFeeEstimates: {
          low: {
            minWaitTimeEstimate: 180000,
            maxWaitTimeEstimate: 300000,
            suggestedMaxPriorityFeePerGas: '3',
            suggestedMaxFeePerGas: '53',
          },
        },
      },
    },
    nonRPCGasFeeApisDisabled: false,
    isUnlocked: false,
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
      },
    ],
    logs: [
      {
        id: 'log1',
        timestamp: 1609459200000,
        message: 'Test log',
      },
    ],
    subscriptionAccountsSeen: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': true,
    },
    isMetamaskNotificationsFeatureSeen: false,
    isNotificationServicesEnabled: false,
    isFeatureAnnouncementsEnabled: false,
    metamaskNotificationsList: {
      notification1: {
        id: 'notification1',
        read: false,
      },
    },
    metamaskNotificationsReadList: {
      notification1: true,
    },
    isCheckingAccountsPresence: false,
    isFetchingMetamaskNotifications: false,
    isUpdatingMetamaskNotifications: false,
    isUpdatingMetamaskNotificationsAccount: false,
    eventsBeforeMetricsOptIn: [
      {
        category: 'App',
        event: 'App Installed',
        properties: {},
      },
    ],
    tracesBeforeMetricsOptIn: [
      {
        request: {
          name: 'Test Trace',
          op: 'test.op',
          startTime: 1609459200000,
        },
        type: 'start',
      },
    ],
    fragments: {
      fragment1: {},
    },
    metaMetricsId:
      '0xf155e67a3c8fced8207d815fae1b5779092806929b590bd3f7a7cd1aaeab440e',
    participateInMetaMetrics: false,
    segmentApiCalls: [
      {
        event: 'test',
        timestamp: 1609459200000,
      },
    ],
    traits: {
      install_date_ext: '2025-01-01',
    },
    dataCollectionForMarketing: false,
    marketingCampaignCookieId: 'campaign1',
    latestNonAnonymousEventTimestamp: 1609459200000,
    metaMetricsDataDeletionId: 'deletion1',
    metaMetricsDataDeletionTimestamp: 1609459200000,
    names: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x1': 'test.eth',
      },
    },
    nameSources: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 'ens',
      },
    },
    useExternalNameSources: false,
    networkConfigurations: {
      mainnet: {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            type: 'infura',
            url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
          },
        ],
      },
    },
    networksMetadata: {
      mainnet: {
        EIPS: {},
        status: 'unknown',
      },
    },
    selectedNetworkClientId: 'mainnet',
    allNftContracts: {
      '0x1': {
        '0x1234567890123456789012345678901234567890': {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '0x1',
          name: 'Test NFT',
        },
      },
    },
    allNfts: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [],
      },
    },
    ignoredNfts: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [],
      },
    },
    completedOnboarding: false,
    firstTimeFlowType: 'create',
    onboardingTabs: {
      tab1: true,
    },
    seedPhraseBackedUp: false,
    securityAlertsEnabled: false,
    storageMetadata: {
      metadata1: {
        version: '1.0.0',
      },
    },
    versionInfo: {
      version1: {
        version: '1.0.0',
      },
    },
    subjects: {
      'https://example.com': {
        origin: 'https://example.com',
        permissions: {
          eth_accounts: {},
        },
      },
    },
    permissionActivityLog: [
      {
        id: 'log1',
        timestamp: 1609459200000,
        method: 'eth_accounts',
      },
    ],
    permissionHistory: {
      'https://example.com': {
        eth_accounts: {
          accounts: {
            '0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1609459200000,
          },
        },
      },
    },
    advancedGasFee: {
      gasPrice: '20000000000',
      maxFeePerGas: '30000000000',
      maxPriorityFeePerGas: '2000000000',
    },
    currentLocale: 'en',
    dismissSeedBackUpReminder: false,
    overrideContentSecurityPolicyHeader: false,
    featureFlags: {
      feature1: true,
    },
    forgottenPassword: false,
    identities: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        name: 'Account 1',
      },
    },
    isIpfsGatewayEnabled: false,
    ipfsGateway: 'dweb.link',
    knownMethodData: {
      '0xa9059cbb': {
        name: 'transfer',
        params: [],
      },
    },
    ledgerTransportType: 'u2f',
    lostIdentities: {
      '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
        address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
        name: 'Lost Account',
      },
    },
    openSeaEnabled: false,
    preferences: {
      autoLockTimeLimit: 0,
      hideZeroBalanceTokens: false,
      showExtensionInFullSizeView: false,
      showFiatInTestnets: false,
      showTestNetworks: false,
      smartTransactionsOptInStatus: '',
      tokenNetworkFilter: {
        '0x1': [],
      },
      showNativeTokenAsMainBalance: false,
      showConfirmationAdvancedDetails: false,
      privacyMode: false,
      avatarType: 'jazzicon',
    },
    useExternalServices: false,
    selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    snapRegistryList: {
      snap1: {
        id: 'snap1',
        name: 'Test Snap',
      },
    },
    theme: 'light',
    signatureSecurityAlertResponses: {
      alert1: 'approved',
    },
    addressSecurityAlertResponses: {
      address1: 'approved',
    },
    use4ByteResolution: false,
    useAddressBarEnsResolution: false,
    useBlockie: false,
    useCurrencyRateCheck: false,
    useMultiAccountBalanceChecker: false,
    useNftDetection: false,
    usePhishDetect: false,
    useTokenDetection: false,
    useTransactionSimulations: false,
    enableMV3TimestampSave: false,
    remoteFeatureFlags: {
      feature1: {
        enabled: true,
      },
    },
    cacheTimestamp: 1609459200000,
    rewardsActiveAccount: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    rewardsAccounts: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {},
    },
    rewardsSubscriptions: {
      subscription1: {},
    },
    rewardsSeasons: {
      season1: {},
    },
    rewardsSeasonStatuses: {
      season1: 'active',
    },
    rewardsSubscriptionTokens: {
      token1: {},
    },
    fcmToken: 'fcm-token-1',
    fiatCurrency: 'usd',
    rates: {
      ETH: '2000',
    },
    cryptocurrencies: ['ETH'],
    domains: {
      'https://example.com': '0x1',
    },
    unapprovedPersonalMsgCount: 1,
    unapprovedPersonalMsgs: {
      msg1: {
        id: 'msg1',
        msgParams: {},
      },
    },
    unapprovedTypedMessages: {
      msg1: {
        id: 'msg1',
        msgParams: {},
      },
    },
    unapprovedTypedMessagesCount: 1,
    smartTransactionsState: {
      fees: {
        approvalTxFees: {
          fee1: '1000000000000000',
        },
        tradeTxFees: {
          fee1: '1000000000000000',
        },
      },
      liveness: false,
      smartTransactions: {
        tx1: {
          id: 'tx1',
          status: 'pending',
        },
      },
      userOptIn: false,
      userOptInV2: false,
    },
    snaps: {
      'npm:@metamask/test-snap': {
        id: 'npm:@metamask/test-snap',
        version: '1.0.0',
        origin: 'npm:@metamask/test-snap',
      },
    },
    interfaces: {
      interface1: {
        id: 'interface1',
      },
    },
    insights: {
      insight1: {
        id: 'insight1',
        type: 'transaction',
      },
    },
    database: null,
    lastUpdated: 1609459200000,
    databaseUnavailable: false,
    subjectMetadata: {
      'https://example.com': {
        origin: 'https://example.com',
        name: 'Example',
        subjectType: 'website',
      },
    },
    swapsState: {
      approveTxId: 'tx1',
      customApproveTxData: null,
      customGasPrice: '20000000000',
      customMaxFeePerGas: '30000000000',
      customMaxGas: '21000',
      customMaxPriorityFeePerGas: '2000000000',
      errorKey: null,
      fetchParams: {
        param1: 'value1',
      },
      quotes: {
        quote1: {
          id: 'quote1',
        },
      },
      quotesLastFetched: 1609459200000,
      quotesPollingLimitEnabled: false,
      routeState: {
        route1: {},
      },
      saveFetchedQuotes: false,
      selectedAggId: 'agg1',
      swapsFeatureFlags: {
        feature1: true,
      },
      swapsFeatureIsLive: false,
      swapsQuotePrefetchingRefreshTime: 1609459200000,
      swapsQuoteRefreshTime: 1609459200000,
      swapsStxBatchStatusRefreshTime: 1609459200000,
      swapsStxStatusDeadline: 1609459200000,
      swapsStxGetTransactionsRefreshTime: 1609459200000,
      swapsStxMaxFeeMultiplier: 1.5,
      swapsUserFeeLevel: 'medium',
      tokens: {
        '0x0000000000000000000000000000000000000000': {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'ETH',
        },
      },
      topAggId: 'agg1',
      tradeTxId: 'tx1',
    },
    preventPollingOnNetworkRestart: false,
    tokensChainsCache: {
      '0x1': {
        timestamp: 1609459200000,
        data: {},
      },
    },
    tokenBalances: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x1': {
          '0x1234567890123456789012345678901234567890': '0x0',
        },
      },
    },
    marketData: {
      '0x1234567890123456789012345678901234567890': {
        '0x1': {
          price: '1.5',
        },
      },
    },
    allDetectedTokens: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [],
      },
    },
    allIgnoredTokens: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [],
      },
    },
    allTokens: {
      '0x1': {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
          {
            address: '0x1234567890123456789012345678901234567890',
            symbol: 'TEST',
            decimals: 18,
          },
        ],
      },
    },
    transactions: {
      tx1: {
        id: 'tx1',
        chainId: '0x1',
        status: 'confirmed',
        time: 1609459200000,
      },
    },
    lastFetchedBlockNumbers: {
      '0x1': '0x123456',
    },
    methodData: {
      '0xa9059cbb': {
        name: 'transfer',
        params: [],
      },
    },
    userOperations: {
      op1: {
        id: 'op1',
        chainId: '0x1',
        status: 'pending',
      },
    },
    isBackupAndSyncEnabled: false,
    isBackupAndSyncUpdateLoading: false,
    isAccountSyncingEnabled: false,
    isContactSyncingEnabled: false,
    isInitialized: false,
    useSafeChainsListValidation: false,
    watchEthereumAccountEnabled: false,
    newPrivacyPolicyToastClickedOrClosed: null,
    newPrivacyPolicyToastShownDate: 1609459200000,
  },
};

export default fixture;
