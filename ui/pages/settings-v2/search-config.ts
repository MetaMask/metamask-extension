import { THIRD_PARTY_APIS_ROUTE } from '../../helpers/constants/routes';

export type SearchItemMeta = {
  readonly id: string;
  readonly titleKey: string;
};

type SearchableSubPage = {
  /** Route path — labelKey is derived from SETTINGS_V2_ROUTE_META */
  path: string;
  items: SearchItemMeta[];
};

export type TabSearchConfig = {
  tabId: string;
  items: SearchItemMeta[];
  subPages?: SearchableSubPage[];
};

function createSearchItemMeta(
  record: Record<string, string>,
): SearchItemMeta[] {
  return Object.entries(record).map(([id, titleKey]) => ({ id, titleKey }));
}

// id → titleKey per section
// Tab components import these records to reference titleKey values.
// The search config array below is auto-derived from them.

export const ASSET_ITEMS = {
  'local-currency': 'localCurrency',
  'show-network-token': 'showNativeTokenAsMainBalance',
  'hide-zero-balance-tokens': 'hideZeroBalanceTokens',
  'display-nft-media': 'displayNftMedia',
  'autodetect-nfts': 'useNftDetection',
  'autodetect-tokens': 'autoDetectTokens',
} as const;

export const TRANSACTION_ITEMS = {
  'estimate-balance-changes': 'simulationsSettingSubHeader',
  'security-alerts': 'securityAlerts',
  'smart-transactions': 'smartTransactions',
  'smart-account-requests-from-dapps': 'smartAccountRequestsFromDapps',
  'proposed-nicknames': 'externalNameSourcesSetting',
  'show-hex-data': 'showHexData',
} as const;

export const PREFERENCES_ITEMS = {
  theme: 'theme',
  language: 'language',
  'account-identicon': 'accountIdenticon',
  'show-default-address': 'showDefaultAddress',
  'show-extension': 'showExtensionInFullSizeView',
  'manage-institutional-wallet': 'manageInstitutionalWallets',
} as const;

export const PRIVACY_ITEMS = {
  'basic-functionality': 'basicConfigurationLabel',
  'third-party-apis': 'thirdPartyApis',
  'batch-account-balance-requests': 'useMultiAccountBalanceChecker',
  'skip-link-confirmation': 'skipLinkConfirmationScreens',
  metametrics: 'participateInMetaMetrics',
  'data-collection': 'dataCollectionForMarketing',
  'delete-metametrics-data': 'deleteMetaMetricsData',
  'download-state-logs': 'downloadStateLogs',
} as const;

export const THIRD_PARTY_API_ITEMS = {
  'network-details-check': 'useSafeChainsListValidation',
  'show-ens-domains': 'ensDomainsSettingTitle',
  'make-smart-contracts-easier': 'makeSmartContractsEasier',
  'ipfs-gateway': 'ipfsGateway',
  'display-nft-media': 'displayNftMedia',
  'autodetect-nfts': 'useNftDetection',
  'proposed-nicknames': 'externalNameSourcesSetting',
} as const;

export const SECURITY_ITEMS = {
  'manage-wallet-recovery': 'manageWalletRecovery',
  password: 'password',
  'auto-lock': 'autoLock',
  'phishing-detection': 'usePhishingDetection',
} as const;

export const BACKUP_AND_SYNC_ITEMS = {
  'backup-toggle': 'backupAndSyncEnable',
  'features-toggles': 'backupAndSyncFeatureAccounts',
  'contact-syncing': 'backupAndSyncFeatureContacts',
} as const;

export const EXPERIMENTAL_ITEMS = {
  notifications: 'notificationsFeatureToggle',
  'keyring-snaps': 'addSnapAccountToggle',
  'watch-account': 'watchEthereumAccountsToggle',
} as const;

export const NOTIFICATIONS_ITEMS = {
  'allow-notifications': 'notifications',
  'account-activity': 'accountActivity',
} as const;

export const DEVELOPER_OPTIONS_ITEMS = {
  'show-fiat-in-testnets': 'showFiatConversionInTestnets',
  'auto-reset-account': 'clearActivity',
} as const;

// ── Registry (auto-derived) ─────────────────────────────────────────────

export const SETTINGS_V2_SEARCH_CONFIG: TabSearchConfig[] = [
  { tabId: 'assets', items: createSearchItemMeta(ASSET_ITEMS) },
  { tabId: 'transactions', items: createSearchItemMeta(TRANSACTION_ITEMS) },
  {
    tabId: 'preferences-and-display',
    items: createSearchItemMeta(PREFERENCES_ITEMS),
  },
  {
    tabId: 'privacy',
    items: createSearchItemMeta(PRIVACY_ITEMS),
    subPages: [
      {
        path: THIRD_PARTY_APIS_ROUTE,
        items: createSearchItemMeta(THIRD_PARTY_API_ITEMS),
      },
    ],
  },
  {
    tabId: 'security-and-password',
    items: createSearchItemMeta(SECURITY_ITEMS),
  },
  {
    tabId: 'backup-and-sync',
    items: createSearchItemMeta(BACKUP_AND_SYNC_ITEMS),
  },
  { tabId: 'experimental', items: createSearchItemMeta(EXPERIMENTAL_ITEMS) },
  { tabId: 'notifications', items: createSearchItemMeta(NOTIFICATIONS_ITEMS) },
  {
    tabId: 'developer-options',
    items: createSearchItemMeta(DEVELOPER_OPTIONS_ITEMS),
  },
];
