import type { LegacyMigration, MigrationState } from '../lib/migrator';

export type LegacyToken = {
  decimals?: string | number;
  address?: string;
  symbol?: string;
  [key: string]: unknown;
};

export type LegacyPreferencesController = {
  tokens?: LegacyToken[];
  accountTokens?: Record<string, Record<string, LegacyToken[]>>;
  accountHiddenTokens?: Record<string, Record<string, LegacyToken[]>>;
  assetImages?: Record<string, unknown>;
  hiddenTokens?: unknown;
  suggestedTokens?: unknown;
  knownMethodData?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  frequentRpcListDetail?: { chainId: string; [key: string]: unknown }[];
  securityAlertsEnabled?: boolean;
  transactionSecurityCheckEnabled?: boolean;
  useLedgerLive?: boolean;
  ledgerTransportType?: unknown;
  useCollectibleDetection?: boolean;
  useNftDetection?: boolean;
  completedOnboarding?: boolean;
  firstTimeFlowType?: unknown;
  [key: string]: unknown;
};

export type LegacyTransaction = Record<string, unknown> & {
  id?: string | number | null;
  hash?: string;
  type?: string;
  chainId?: string;
  metamaskNetworkId?: string;
  txParams?: { nonce?: string; [key: string]: unknown };
  history?: unknown[];
};

export type LegacyTransactionController = {
  transactions?: LegacyTransaction[] | Record<string, LegacyTransaction>;
  [key: string]: unknown;
};

export type LegacyNetworkController = {
  provider?: Record<string, unknown>;
  providerConfig?: Record<string, unknown>;
  networkConfigurations?: Record<string, unknown>;
  network?: unknown;
  networkId?: unknown;
  [key: string]: unknown;
};

export type LegacyIncomingTransactionsController = {
  incomingTxLastFetchedBlocksByNetwork?: Record<string, unknown>;
  incomingTxLastFetchedBlockByChainId?: Record<string, unknown>;
  [key: string]: unknown;
};

export type LegacyNotificationController = {
  notifications?: Record<string, { date?: string; [key: string]: unknown }>;
  arbitraryControllerProp?: unknown;
  [key: string]: unknown;
};

export type LegacyTokensController = {
  allTokens?: Record<string, Record<string, LegacyToken[]>>;
  allIgnoredTokens?: Record<string, Record<string, LegacyToken[]>>;
  [key: string]: unknown;
};

export type LegacyPermissionsMetadata = {
  domainMetadata?: Record<string, unknown>;
  permissionsHistory?: Record<string, unknown>;
  permissionsLog?: unknown[];
  [key: string]: unknown;
};

export type LegacyDomainPermission = {
  parentCapability?: string;
  caveats?: Array<{
    name?: string;
    type?: string;
    value?: unknown;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export type LegacyPermissionsController = {
  domains?: Record<
    string,
    {
      permissions?: LegacyDomainPermission[];
      [key: string]: unknown;
    }
  >;
  [key: string]: unknown;
};

export type LegacySubjectMetadataController = {
  subjectMetadata?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
};

export type LegacyTokenListController = {
  tokensChainsCache?: Record<
    string,
    { data?: unknown; [key: string]: unknown }
  >;
  [key: string]: unknown;
};

export type LegacyNftController = {
  allNfts?: Record<string, unknown>;
  allNftContracts?: Record<string, unknown>;
  ignoredNfts?: unknown;
  [key: string]: unknown;
};

export type LegacyCollectiblesController = {
  allCollectibleContracts?: Record<string, unknown>;
  allCollectibles?: Record<string, unknown>;
  allContracts?: Record<string, unknown>;
  ignoredCollectibles?: unknown;
  [key: string]: unknown;
};

export type LegacyCachedBalancesController = {
  cachedBalances?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
};

export type LegacyAppStateController = {
  swapsWelcomeMessageHasBeenShown?: unknown;
  collectiblesDetectionNoticeDismissed?: unknown;
  recoveryPhraseReminderHasBeenShown?: unknown;
  recoveryPhraseReminderLastShown?: unknown;
  [key: string]: unknown;
};

export type LegacyMetaMaskSubstate = {
  showPortfolioTooltip?: unknown;
  [key: string]: unknown;
};

export type LegacyState = MigrationState['data'] &
  Partial<{
    metamask: LegacyMetaMaskSubstate;
    PreferencesController: LegacyPreferencesController;
    TransactionController: LegacyTransactionController;
    NetworkController: LegacyNetworkController;
    IncomingTransactionsController: LegacyIncomingTransactionsController;
    NotificationController: LegacyNotificationController;
    AnnouncementController: LegacyNotificationController;
    AppStateController: LegacyAppStateController;
    MetaMetricsController: Record<string, unknown>;
    OnboardingController: Record<string, unknown>;
    TokensController: LegacyTokensController;
    PermissionsController: LegacyPermissionsController;
    PermissionsMetadata: LegacyPermissionsMetadata;
    PermissionController: LegacyPermissionsController;
    PermissionLogController: Record<string, unknown>;
    SubjectMetadataController: LegacySubjectMetadataController;
    CachedBalancesController: LegacyCachedBalancesController;
    ThreeBoxController: Record<string, unknown>;
    TokenListController: LegacyTokenListController;
    NftController: LegacyNftController;
    CollectiblesController: LegacyCollectiblesController;
  }>;

export type { LegacyMigration, MigrationState };
