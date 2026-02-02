import { cloneDeep } from 'lodash';
import { RpcEndpointType, NetworkStatus } from '@metamask/network-controller';
import { SubjectType } from '@metamask/permission-controller';
import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import { GasEstimateTypes } from '../../../shared/constants/gas';
import { ThemeType } from '../../../shared/constants/preferences';
import onboardingFixtureJson from './onboarding-fixture.json';

/**
 * Type for the fixture data structure
 */
export type FixtureData = typeof onboardingFixtureJson;

/**
 * The migration version from onboarding-fixture.json.
 * This is dynamically read so it stays in sync when the fixture is updated.
 */
export const FIXTURE_STATE_METADATA_VERSION =
  onboardingFixtureJson.meta.version;

/**
 * The same SRP used in the legacy default-fixture.js for consistency across all E2E tests.
 */
export const E2E_SRP =
  'spread raise short crane omit tent fringe mandate neglect detail suspect cradle';

/**
 * The default account address derived from E2E_SRP
 */
export const DEFAULT_FIXTURE_ACCOUNT =
  '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

/**
 * The default account ID used in fixtures
 */
export const DEFAULT_FIXTURE_ACCOUNT_ID =
  'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4';

/**
 * Default localhost network client ID
 */
export const LOCALHOST_NETWORK_CLIENT_ID = 'networkConfigurationId';

/**
 * Vault encrypted with E2E_SRP - same as legacy default-fixture.js
 * This vault contains the HD Key Tree keyring with the E2E_SRP seed phrase.
 */
const DEFAULT_VAULT =
  '{"data":"WHaP1FrrtV4zUonudIppDifsLHF39g6oPkVksAIdWAHBRzax1uy1asfAJprR7u72t4/HuYz5yPIFQrnNnv+hwQu9GRuty88VKMnvMy+sq8MNtoXI+C54bZpWa8r4iUQfa0Mj/cfJbpFpzOdF1ZYXahTfTcU5WsrHwvJew842CiJR4B2jmCHHXfm/DxLK3WazsVQwXJGx/U71UelGoOOrT8NI28EKrAwgPn+7Xmv0j92gmhau30N7Bo2fr6Zv","iv":"LfD8/tY1EjXzxuemSmDVdA==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"nk4xdpmMR+1s5BYe4Vnk++XAQwrISI2bCtbMg7V1wUA="}';

/**
 * Default account structure for Account 1
 */
const DEFAULT_ACCOUNT = {
  id: DEFAULT_FIXTURE_ACCOUNT_ID,
  address: DEFAULT_FIXTURE_ACCOUNT,
  metadata: {
    name: 'Account 1',
    lastSelected: 1665507600000,
    keyring: {
      type: 'HD Key Tree' as const,
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
  type: 'eip155:eoa' as const,
  scopes: ['eip155:0'],
} as const;

/**
 * Returns the raw onboarding fixture (fresh clone).
 * Use this when you need a fixture representing a fresh install before onboarding.
 *
 * @returns A deep clone of onboarding-fixture.json
 */
export function getOnboardingFixture(): FixtureData {
  return cloneDeep(onboardingFixtureJson);
}

// ============================================================
// Default Controller Data
// Single object containing all default controller configurations
// ============================================================

/**
 * Default controller data for building a completed onboarding fixture.
 * Used by FixtureBuilderV2 to set up the default state.
 *
 * @example
 * defaultFixture.OnboardingController // { completedOnboarding: true, ... }
 * defaultFixture.AccountsController   // { internalAccounts: { ... } }
 */
export const defaultFixture = {
  OnboardingController: {
    completedOnboarding: true,
    firstTimeFlowType: FirstTimeFlowType.import,
    seedPhraseBackedUp: true,
  },

  KeyringController: {
    vault: DEFAULT_VAULT,
  },

  AccountsController: {
    internalAccounts: {
      selectedAccount: DEFAULT_FIXTURE_ACCOUNT_ID,
      accounts: {
        [DEFAULT_FIXTURE_ACCOUNT_ID]: DEFAULT_ACCOUNT,
      },
    },
  },

  AuthenticationController: {
    isSignedIn: true,
  },

  PreferencesController: {
    selectedAddress: DEFAULT_FIXTURE_ACCOUNT,
    identities: {
      [DEFAULT_FIXTURE_ACCOUNT]: {
        address: DEFAULT_FIXTURE_ACCOUNT,
        lastSelected: 1665507600000,
        name: 'Account 1',
      },
    },
    dismissSeedBackUpReminder: true,
    useExternalServices: true,
    overrideContentSecurityPolicyHeader: true,
    ipfsGateway: 'dweb.link',
    ledgerTransportType: LedgerTransportTypes.webhid,
    openSeaEnabled: false,
    useBlockie: false,
    useNftDetection: false,
    usePhishDetect: true,
    useTokenDetection: false,
    useCurrencyRateCheck: true,
    useMultiAccountBalanceChecker: true,
    isMultiAccountBalancesEnabled: true,
    theme: ThemeType.light,
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
    referrals: {
      hyperliquid: {},
    },
  },

  AppStateController: {
    connectedStatusPopoverHasBeenShown: true,
    // Note: These are placeholder strings that get replaced at runtime with actual timestamps
    termsOfUseLastAgreed:
      '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds' as unknown as number,
    recoveryPhraseReminderHasBeenShown: true,
    recoveryPhraseReminderLastShown:
      '__FIXTURE_SUBSTITUTION__currentDateInMilliseconds' as unknown as number,
    newPrivacyPolicyToastClickedOrClosed: true,
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

  MetaMetricsController: {
    eventsBeforeMetricsOptIn: [],
    tracesBeforeMetricsOptIn: [],
    participateInMetaMetrics: false,
    dataCollectionForMarketing: false,
    fragments: {},
    metaMetricsId: null,
    traits: {},
    latestNonAnonymousEventTimestamp: 0,
  },

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
    gasEstimateType: GasEstimateTypes.none,
    gasFeeEstimates: {},
  },

  TokensController: {
    allDetectedTokens: {},
    allIgnoredTokens: {},
    allTokens: {},
  },

  TransactionController: {
    transactions: [],
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
        subjectType: SubjectType.Website,
      },
    },
  },

  PermissionController: {
    subjects: {},
  },

  SelectedNetworkController: {
    domains: {},
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

  NotificationServicesController: {
    subscriptionAccountsSeen: [],
    isFeatureAnnouncementsEnabled: false,
    isNotificationServicesEnabled: false,
    isMetamaskNotificationsFeatureSeen: false,
    metamaskNotificationsList: [],
    metamaskNotificationsReadList: [],
  },
} as const;

// ============================================================
// Chain-dependent data builders
// ============================================================

/**
 * Builds AccountTracker data for a specific chain ID
 *
 * @param inputChainId - The chain ID to track
 */
export function buildAccountTrackerData(inputChainId: string) {
  return {
    accountsByChainId: {
      [inputChainId]: {
        [DEFAULT_FIXTURE_ACCOUNT]: { balance: '0x0' },
      },
    },
  };
}

/**
 * Builds localhost network configuration for NetworkController
 *
 * @param inputChainId - The chain ID for localhost
 */
export function buildLocalhostNetworkConfig(inputChainId: string) {
  return {
    blockExplorerUrls: [] as string[],
    chainId: inputChainId as Hex,
    defaultBlockExplorerUrlIndex: undefined,
    defaultRpcEndpointIndex: 0,
    name: 'Localhost 8545',
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        failoverUrls: [] as string[],
        networkClientId: LOCALHOST_NETWORK_CLIENT_ID,
        type: RpcEndpointType.Custom as const,
        url: 'http://localhost:8545',
      },
    ],
  };
}

/**
 * Builds NetworkEnablementController data for a specific chain ID
 *
 * @param inputChainId - The chain ID to enable
 */
export function buildNetworkEnablementControllerData(inputChainId: string) {
  return {
    enabledNetworkMap: {
      eip155: {
        [inputChainId]: true,
      },
      solana: {
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
      },
      tron: {
        'tron:728126428': true,
      },
      bip122: {
        'bip122:000000000019d6689c085ae165831e93': true,
      },
    },
  };
}

/**
 * Builds NetworkOrderController data for a specific chain ID
 *
 * @param inputChainId - The chain ID to include in the network order (hex format like '0x539')
 */
export function buildNetworkOrderControllerData(inputChainId: string) {
  // Convert hex chain IDs to CAIP-2 format (eip155:chainId)
  const hexToDecimal = (hex: string) => parseInt(hex, 16).toString();
  const toCaipChainId = (hex: string) =>
    `eip155:${hexToDecimal(hex)}` as `${string}:${string}`;

  return {
    orderedNetworkList: [
      { networkId: toCaipChainId('0x1') }, // Mainnet
      { networkId: toCaipChainId('0xe708') }, // Linea
      { networkId: toCaipChainId(inputChainId) }, // Localhost
    ],
  };
}
