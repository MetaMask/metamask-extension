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
  CurrencyController: {
    currencyRates: {
      ETH: {
        conversionRate: null,
        conversionDate: 0,
        usdConversionRate: null,
      },
    },
  },
  MetaMetricsController: {
    participateInMetaMetrics: null,
    dataCollectionForMarketing: null,
  },
  NetworkController: {
    networkConfigurationsByChainId: {},
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
  TokensController: {
    allTokens: {},
  },
  TxController: {
    transactions: [],
  },
} as const;
