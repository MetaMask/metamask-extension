import { type DefaultAddressScope } from '../constants/default-address';

export type Preferences = {
  autoLockTimeLimit?: number;
  avatarType?: 'maskicon' | 'jazzicon' | 'blockies';
  defaultAddressScope: DefaultAddressScope;
  dismissSmartAccountSuggestionEnabled: boolean;
  featureNotificationsEnabled: boolean;
  hideZeroBalanceTokens: boolean;
  isBasicFunctionalityConsolidatedEnabled: boolean;
  /**
   * True when this wallet has (or had) a linked social-login profile, including
   * after local OAuth state is cleared by SRP import/restore.
   */
  hasLinkedSocialLoginProfile: boolean;
  basicFunctionalityMigrationNotification: 'modal' | 'toast' | null;
  basicFunctionalityMigrationNotificationDismissed: boolean;
  privacyMode: boolean;
  showConfirmationAdvancedDetails: boolean;
  showDefaultAddress: boolean;
  showExtensionInFullSizeView: boolean;
  showFiatInTestnets: boolean;
  showTickerWidget: boolean;
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
  gasSponsorshipOptOutByChainId: Record<string, boolean>;
};
