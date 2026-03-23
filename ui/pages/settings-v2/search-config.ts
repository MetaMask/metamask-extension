import { THIRD_PARTY_APIS_ROUTE } from '../../helpers/constants/routes';

type SearchableSubPage = {
  /** Route path — labelKey is derived from SETTINGS_V2_ROUTE_META */
  path: string;
  titleKeys: string[];
};

export type TabSearchConfig = {
  tabId: string;
  titleKeys: string[];
  subPages?: SearchableSubPage[];
};

export const SETTINGS_V2_SEARCH_CONFIG: TabSearchConfig[] = [
  {
    tabId: 'assets',
    titleKeys: [
      'localCurrency',
      'showNativeTokenAsMainBalance',
      'hideZeroBalanceTokens',
      'displayNftMedia',
      'useNftDetection',
      'autoDetectTokens',
    ],
  },
  {
    tabId: 'transactions',
    titleKeys: [
      'simulationsSettingSubHeader',
      'securityAlerts',
      'smartTransactions',
      'smartAccountRequestsFromDapps',
      'externalNameSourcesSetting',
      'showHexData',
    ],
  },
  {
    tabId: 'preferences-and-display',
    titleKeys: [
      'theme',
      'language',
      'accountIdenticon',
      'showDefaultAddress',
      'showExtensionInFullSizeView',
      'manageInstitutionalWallets',
    ],
  },
  {
    tabId: 'privacy',
    titleKeys: [
      'basicConfigurationLabel',
      'thirdPartyApis',
      'useMultiAccountBalanceChecker',
      'skipLinkConfirmationScreens',
      'participateInMetaMetrics',
      'dataCollectionForMarketing',
      'deleteMetaMetricsData',
      'downloadStateLogs',
    ],
    subPages: [
      {
        path: THIRD_PARTY_APIS_ROUTE,
        titleKeys: [
          'useSafeChainsListValidation',
          'ensDomainsSettingTitle',
          'makeSmartContractsEasier',
          'ipfsGateway',
          'displayNftMedia',
          'useNftDetection',
          'externalNameSourcesSetting',
        ],
      },
    ],
  },
  {
    tabId: 'security-and-password',
    titleKeys: [
      'manageWalletRecovery',
      'password',
      'autoLock',
      'usePhishingDetection',
    ],
  },
  {
    tabId: 'developer-options',
    titleKeys: ['showFiatConversionInTestnets', 'clearActivity'],
  },
];
