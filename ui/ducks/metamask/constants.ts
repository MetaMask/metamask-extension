import { Preferences } from '../../../app/scripts/controllers/preferences-controller';
import type {
  BackgroundStateProxy,
  MemStoreControllersComposedState,
} from '../../../app/scripts/metamask-controller-stores';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../shared/constants/preferences';

export const initialMetamaskState: Omit<
  BackgroundStateProxy,
  keyof MemStoreControllersComposedState
> &
  Partial<{
    [ControllerName in keyof MemStoreControllersComposedState]: Partial<
      MemStoreControllersComposedState[ControllerName]
    >;
  }> = {
  isInitialized: false,
  KeyringController: {
    isUnlocked: false,
    keyrings: [],
  },
  AccountsController: {
    internalAccounts: { accounts: {}, selectedAccount: '' },
  },
  AccountTracker: {
    currentBlockGasLimit: '',
    currentBlockGasLimitByChainId: {},
  },
  AddressBookController: {
    addressBook: {},
  },
  ApprovalController: {
    pendingApprovals: {},
    approvalFlows: [],
  },
  CurrencyController: {
    currencyRates: {
      ETH: {
        conversionRate: null,
        conversionDate: 0,
        usdConversionRate: null,
      },
    },
  },
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  CustodyController: {
    custodyAccountDetails: {},
  },
  ///: END:ONLY_INCLUDE_IF
  DecryptMessageController: {
    unapprovedDecryptMsgs: {},
  },
  GasFeeController: {
    gasFeeEstimates: {},
    gasEstimateType: 'none',
  },
  MetaMetricsController: {
    participateInMetaMetrics: null,
    dataCollectionForMarketing: null,
  },
  NetworkController: {
    selectedNetworkClientId: '',
    networkConfigurationsByChainId: {},
    networksMetadata: {},
  },
  OnboardingController: {
    firstTimeFlowType: null,
    completedOnboarding: false,
  },
  PreferencesController: {
    useBlockie: false,
    use4ByteResolution: true,
    featureFlags: {},
    currentLocale: '',
    knownMethodData: {},
    ledgerTransportType: undefined,
    preferences: {
      autoLockTimeLimit: DEFAULT_AUTO_LOCK_TIME_LIMIT,
      showExtensionInFullSizeView: false,
      showFiatInTestnets: false,
      showTestNetworks: false,
      smartTransactionsOptInStatus: true,
      petnamesEnabled: true,
      featureNotificationsEnabled: false,
      privacyMode: false,
      showMultiRpcModal: false,
    } as Preferences,
  },
  SignatureController: {
    unapprovedPersonalMsgs: {},
    unapprovedTypedMessages: {},
  },
  TokensController: {
    allTokens: {},
  },
  TxController: {
    transactions: [],
  },
} as const;
