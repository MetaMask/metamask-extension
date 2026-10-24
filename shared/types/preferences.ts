import { type DefaultAddressScope } from '../constants/default-address';

export type Preferences = {
  autoLockTimeLimit?: number;
  avatarType?: 'maskicon' | 'jazzicon' | 'blockies';
  defaultAddressScope: DefaultAddressScope;
  dismissSmartAccountSuggestionEnabled: boolean;
  featureNotificationsEnabled: boolean;
  hideZeroBalanceTokens: boolean;
  isBasicFunctionalityConsolidatedEnabled: boolean;
  hasLinkedSocialLoginProfile: boolean;
  basicFunctionalityMigrationNotification: 'modal' | 'toast' | null;
  basicFunctionalityMigrationNotificationDismissed: boolean;
  privacyMode: boolean;
  /** `true` asks for support data sharing consent every time; `false` applies `supportDataSharingPreference`. */
  shouldShowSupportConsent: boolean;
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
  /** The saved support data sharing choice; `null` until the user saves one. */
  supportDataSharingPreference: boolean | null;
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
