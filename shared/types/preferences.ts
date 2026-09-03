import { type DefaultAddressScope } from '../constants/default-address';

export type Preferences = {
  autoLockTimeLimit?: number;
  avatarType?: 'maskicon' | 'jazzicon' | 'blockies';
  defaultAddressScope: DefaultAddressScope;
  dismissSmartAccountSuggestionEnabled: boolean;
  featureNotificationsEnabled: boolean;
  hideZeroBalanceTokens: boolean;
  isBasicFunctionalityConsolidatedEnabled: boolean;
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
  /** Session-wide perps order type. Market-agnostic; survives the 60s draft TTL. */
  perpsSelectedOrderType?: 'market' | 'limit';
  /** Order-book listed-by currency. Market-agnostic. */
  perpsOrderBookCurrency?: 'base' | 'usd';
  /** Order-book listed-by metric. Market-agnostic. */
  perpsOrderBookMetric?: 'size' | 'total';
  /** Number of candles shown on the perps chart. Session- and market-agnostic. */
  perpsVisibleCandleCount?: number;
  gasSponsorshipOptOutByChainId: Record<string, boolean>;
};
