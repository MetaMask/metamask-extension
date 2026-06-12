import { type DefaultAddressScope } from '../constants/default-address';

export type Preferences = {
  autoLockTimeLimit?: number;
  avatarType?: 'maskicon' | 'jazzicon' | 'blockies';
  defaultAddressScope: DefaultAddressScope;
  dismissSmartAccountSuggestionEnabled: boolean;
  featureNotificationsEnabled: boolean;
  hideZeroBalanceTokens: boolean;
  privacyMode: boolean;
  showConfirmationAdvancedDetails: boolean;
  showDefaultAddress: boolean;
  showExtensionInFullSizeView: boolean;
  showFiatInTestnets: boolean;
  showMultiRpcModal: boolean;
  showNativeTokenAsMainBalance: boolean;
  showTestNetworks: boolean;
  skipDeepLinkInterstitial: boolean;
  smartTransactionsOptInStatus: boolean;
  smartTransactionsMigrationApplied: boolean;
  tokenNetworkFilter: Record<string, boolean>;
  tokenSortConfig: {
    key: string;
    order: string;
    sortCallback: string;
  };
  useNativeCurrencyAsPrimaryCurrency: boolean;
  useSidePanelAsDefault?: boolean;
  perpsSelectedCandlePeriod?: string;
};
