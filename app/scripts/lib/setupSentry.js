import * as Sentry from '@sentry/browser';
import { Dedupe, ExtraErrorData } from '@sentry/integrations';

import extractEthjsErrorMessage from './extractEthjsErrorMessage';

/* eslint-disable prefer-destructuring */
// Destructuring breaks the inlining of the environment variables
const METAMASK_DEBUG = process.env.METAMASK_DEBUG;
const METAMASK_ENVIRONMENT = process.env.METAMASK_ENVIRONMENT;
const SENTRY_DSN_DEV = process.env.SENTRY_DSN_DEV;
/* eslint-enable prefer-destructuring */

<<<<<<< HEAD
=======
export const ERROR_URL_ALLOWLIST = {
  CRYPTOCOMPARE: 'cryptocompare.com',
  COINGECKO: 'coingecko.com',
  ETHERSCAN: 'etherscan.io',
  CODEFI: 'codefi.network',
  SEGMENT: 'segment.io',
};

// This describes the subset of background controller state attached to errors
// sent to Sentry These properties have some potential to be useful for
// debugging, and they do not contain any identifiable information.
export const SENTRY_BACKGROUND_STATE = {
  AccountTracker: {
    accounts: false,
    currentBlockGasLimit: true,
  },
  AddressBookController: {
    addressBook: false,
  },
  AlertController: {
    alertEnabledness: true,
    unconnectedAccountAlertShownOrigins: false,
    web3ShimUsageOrigins: false,
  },
  AnnouncementController: {
    announcements: false,
  },
  AppMetadataController: {
    currentAppVersion: true,
    currentMigrationVersion: true,
    previousAppVersion: true,
    previousMigrationVersion: true,
  },
  ApprovalController: {
    approvalFlows: false,
    pendingApprovals: false,
    pendingApprovalCount: false,
  },
  AppStateController: {
    browserEnvironment: true,
    connectedStatusPopoverHasBeenShown: true,
    currentPopupId: false,
    defaultHomeActiveTabName: true,
    fullScreenGasPollTokens: true,
    hadAdvancedGasFeesSetPriorToMigration92_3: true,
    nftsDetectionNoticeDismissed: true,
    nftsDropdownState: true,
    notificationGasPollTokens: true,
    outdatedBrowserWarningLastShown: true,
    popupGasPollTokens: true,
    qrHardware: true,
    recoveryPhraseReminderHasBeenShown: true,
    recoveryPhraseReminderLastShown: true,
    showBetaHeader: true,
    showProductTour: true,
    showTestnetMessageInDropdown: true,
    snapsInstallPrivacyWarningShown: true,
    termsOfUseLastAgreed: true,
    timeoutMinutes: true,
    trezorModel: true,
    usedNetworks: true,
  },
  CachedBalancesController: {
    cachedBalances: false,
  },
  CronjobController: {
    jobs: false,
  },
  CurrencyController: {
    conversionDate: true,
    conversionRate: true,
    currentCurrency: true,
    nativeCurrency: true,
    pendingCurrentCurrency: true,
    pendingNativeCurrency: true,
    usdConversionRate: true,
  },
  DecryptMessageController: {
    unapprovedDecryptMsgs: false,
    unapprovedDecryptMsgCount: true,
  },
  EncryptionPublicKeyController: {
    unapprovedEncryptionPublicKeyMsgs: false,
    unapprovedEncryptionPublicKeyMsgCount: true,
  },
  EnsController: {
    ensResolutionsByAddress: false,
  },
  GasFeeController: {
    estimatedGasFeeTimeBounds: true,
    gasEstimateType: true,
    gasFeeEstimates: true,
  },
  KeyringController: {
    isUnlocked: true,
    keyrings: false,
  },
  LoggingController: {
    logs: false,
  },
  MetaMetricsController: {
    eventsBeforeMetricsOptIn: false,
    fragments: false,
    metaMetricsId: true,
    participateInMetaMetrics: true,
    previousUserTraits: false,
    segmentApiCalls: false,
    traits: false,
  },
  NetworkController: {
    networkConfigurations: false,
    networksMetadata: true,
    providerConfig: {
      chainId: true,
      id: true,
      nickname: true,
      rpcPrefs: false,
      rpcUrl: false,
      ticker: true,
      type: true,
    },
    selectedNetworkClientId: false,
  },
  NftController: {
    allNftContracts: false,
    allNfts: false,
    ignoredNfts: false,
  },
  NotificationController: {
    notifications: false,
  },
  OnboardingController: {
    completedOnboarding: true,
    firstTimeFlowType: true,
    onboardingTabs: false,
    seedPhraseBackedUp: true,
  },
  PPOMController: {
    chainStatus: true,
    securityAlertsEnabled: false,
    storageMetadata: [],
    versionInfo: [],
  },
  PermissionController: {
    subjects: false,
  },
  PermissionLogController: {
    permissionActivityLog: false,
    permissionHistory: false,
  },
  PhishingController: {},
  PreferencesController: {
    advancedGasFee: true,
    currentLocale: true,
    disabledRpcMethodPreferences: true,
    dismissSeedBackUpReminder: true,
    featureFlags: true,
    forgottenPassword: true,
    identities: false,
    incomingTransactionsPreferences: true,
    ipfsGateway: false,
    isLineaMainnetReleased: true,
    knownMethodData: false,
    ledgerTransportType: true,
    lostIdentities: false,
    openSeaEnabled: true,
    preferences: {
      autoLockTimeLimit: true,
      hideZeroBalanceTokens: true,
      showFiatInTestnets: true,
      showTestNetworks: true,
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    selectedAddress: false,
    snapRegistryList: false,
    theme: true,
    transactionSecurityCheckEnabled: true,
    use4ByteResolution: true,
    useAddressBarEnsResolution: true,
    useBlockie: true,
    useCurrencyRateCheck: true,
    useMultiAccountBalanceChecker: true,
    useNftDetection: true,
    useNonceField: true,
    usePhishDetect: true,
    useTokenDetection: true,
  },
  SelectedNetworkController: { domains: true, perDomainNetwork: false },
  SignatureController: {
    unapprovedMsgCount: true,
    unapprovedMsgs: false,
    unapprovedPersonalMsgCount: true,
    unapprovedPersonalMsgs: false,
    unapprovedTypedMessages: false,
    unapprovedTypedMessagesCount: true,
  },
  SmartTransactionsController: {
    smartTransactionsState: {
      fees: {
        approvalTxFees: true,
        tradeTxFees: true,
      },
      liveness: true,
      smartTransactions: false,
      userOptIn: true,
    },
  },
  SnapController: {
    snapStates: false,
    snaps: false,
  },
  SnapsRegistry: {
    database: false,
    lastUpdated: false,
  },
  SubjectMetadataController: {
    subjectMetadata: false,
  },
  SwapsController: {
    singleChainSwapsState: {
      approveTxId: false,
      customApproveTxData: false,
      customGasPrice: true,
      customMaxFeePerGas: true,
      customMaxGas: true,
      customMaxPriorityFeePerGas: true,
      errorKey: true,
      fetchParams: true,
      quotes: false,
      quotesLastFetched: true,
      quotesPollingLimitEnabled: true,
      routeState: true,
      saveFetchedQuotes: true,
      selectedAggId: true,
      swapsFeatureFlags: true,
      swapsFeatureIsLive: true,
      swapsQuotePrefetchingRefreshTime: true,
      swapsQuoteRefreshTime: true,
      swapsStxBatchStatusRefreshTime: true,
      swapsStxGetTransactionsRefreshTime: true,
      swapsStxMaxFeeMultiplier: true,
      swapsUserFeeLevel: true,
      tokens: false,
      topAggId: false,
      tradeTxId: false,
    },
  },
  TokenListController: {
    preventPollingOnNetworkRestart: true,
    tokenList: false,
    tokensChainsCache: {
      [AllProperties]: false,
    },
  },
  TokenRatesController: {
    contractExchangeRates: false,
  },
  TokensController: {
    allDetectedTokens: {
      [AllProperties]: false,
    },
    allIgnoredTokens: {
      [AllProperties]: false,
    },
    allTokens: {
      [AllProperties]: false,
    },
    detectedTokens: false,
    ignoredTokens: false,
    tokens: false,
  },
  TransactionController: {
    transactions: false,
    lastFetchedBlockNumbers: false,
  },
  TxController: {
    transactions: false,
  },
};

const flattenedBackgroundStateMask = Object.values(
  SENTRY_BACKGROUND_STATE,
).reduce((partialBackgroundState, controllerState) => {
  return {
    ...partialBackgroundState,
    ...controllerState,
  };
}, {});

>>>>>>> upstream/multichain-swaps-controller
// This describes the subset of Redux state attached to errors sent to Sentry
// These properties have some potential to be useful for debugging, and they do
// not contain any identifiable information.
export const SENTRY_STATE = {
  gas: true,
  history: true,
  metamask: {
    alertEnabledness: true,
    completedOnboarding: true,
    connectedStatusPopoverHasBeenShown: true,
    conversionDate: true,
    conversionRate: true,
    currentBlockGasLimit: true,
    currentCurrency: true,
    currentLocale: true,
    customNonceValue: true,
    defaultHomeActiveTabName: true,
    featureFlags: true,
    firstTimeFlowType: true,
    forgottenPassword: true,
    incomingTxLastFetchedBlockByChainId: true,
    ipfsGateway: true,
    isAccountMenuOpen: true,
    isInitialized: true,
    isUnlocked: true,
    metaMetricsId: true,
    nativeCurrency: true,
    network: true,
    nextNonce: true,
    participateInMetaMetrics: true,
    preferences: true,
    provider: {
      nickname: true,
      ticker: true,
      type: true,
    },
    seedPhraseBackedUp: true,
    unapprovedDecryptMsgCount: true,
    unapprovedEncryptionPublicKeyMsgCount: true,
    unapprovedMsgCount: true,
    unapprovedPersonalMsgCount: true,
    unapprovedTypedMessagesCount: true,
    useBlockie: true,
    useNonceField: true,
    usePhishDetect: true,
    welcomeScreenSeen: true,
<<<<<<< HEAD
=======
    useSafeChainsListValidation: true,
    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    addSnapAccountEnabled: false,
    snapsAddSnapAccountModalDismissed: false,
    ///: END:ONLY_INCLUDE_IN
>>>>>>> upstream/multichain-swaps-controller
  },
  unconnectedAccount: true,
};

export default function setupSentry({ release, getState }) {
  let sentryTarget;

  if (METAMASK_DEBUG) {
    return undefined;
  } else if (METAMASK_ENVIRONMENT?.includes('production')) {
    if (!process.env.SENTRY_DSN) {
      throw new Error(
        `Missing SENTRY_DSN environment variable in production environment`,
      );
    }
    console.log(
      `Setting up Sentry Remote Error Reporting for '${METAMASK_ENVIRONMENT}': SENTRY_DSN`,
    );
    sentryTarget = process.env.SENTRY_DSN;
  } else {
    console.log(
      `Setting up Sentry Remote Error Reporting for '${METAMASK_ENVIRONMENT}': SENTRY_DSN_DEV`,
    );
    sentryTarget = SENTRY_DSN_DEV;
  }

  Sentry.init({
    dsn: sentryTarget,
    debug: METAMASK_DEBUG,
    environment: METAMASK_ENVIRONMENT,
    integrations: [new Dedupe(), new ExtraErrorData()],
    release,
    beforeSend: (report) => rewriteReport(report),
  });

  function rewriteReport(report) {
    try {
      // simplify certain complex error messages (e.g. Ethjs)
      simplifyErrorMessages(report);
      // modify report urls
      rewriteReportUrls(report);
      // append app state
      if (getState) {
        const appState = getState();
        if (!report.extra) {
          report.extra = {};
        }
        report.extra.appState = appState;
      }
    } catch (err) {
      console.warn(err);
    }
    return report;
  }

  return Sentry;
}

function simplifyErrorMessages(report) {
  rewriteErrorMessages(report, (errorMessage) => {
    // simplify ethjs error messages
    let simplifiedErrorMessage = extractEthjsErrorMessage(errorMessage);
    // simplify 'Transaction Failed: known transaction'
    if (
      simplifiedErrorMessage.indexOf(
        'Transaction Failed: known transaction',
      ) === 0
    ) {
      // cut the hash from the error message
      simplifiedErrorMessage = 'Transaction Failed: known transaction';
    }
    return simplifiedErrorMessage;
  });
}

function rewriteErrorMessages(report, rewriteFn) {
  // rewrite top level message
  if (typeof report.message === 'string') {
    report.message = rewriteFn(report.message);
  }
  // rewrite each exception message
  if (report.exception && report.exception.values) {
    report.exception.values.forEach((item) => {
      if (typeof item.value === 'string') {
        item.value = rewriteFn(item.value);
      }
    });
  }
}

function rewriteReportUrls(report) {
  // update request url
  report.request.url = toMetamaskUrl(report.request.url);
  // update exception stack trace
  if (report.exception && report.exception.values) {
    report.exception.values.forEach((item) => {
      if (item.stacktrace) {
        item.stacktrace.frames.forEach((frame) => {
          frame.filename = toMetamaskUrl(frame.filename);
        });
      }
    });
  }
}

function toMetamaskUrl(origUrl) {
  const filePath = origUrl.split(window.location.origin)[1];
  if (!filePath) {
    return origUrl;
  }
  const metamaskUrl = `metamask${filePath}`;
  return metamaskUrl;
}
