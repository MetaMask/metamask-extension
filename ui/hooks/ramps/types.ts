/**
 * Ramps data types — TEMPORARY local mirror.
 *
 * These types are copied faithfully from `@metamask/ramps-controller`
 * (see ~/code/extension/core/packages/ramps-controller). They exist here so the
 * money-movement UI can be built against a stable data contract WITHOUT pulling
 * in the controller wiring (background, messenger, redux store actions), which
 * still lands via the data-layer PRs (#43962 / #43963).
 *
 * Swap plan: once the data layer is merged, this file becomes a thin re-export
 * shim — replace the definitions below with:
 *   export type { Provider, Quote, RampsOrder, ... } from '@metamask/ramps-controller';
 * UI code imports everything from `ui/hooks/ramps/types`, so that swap is a
 * one-file change with no churn in components.
 */

// === PROVIDERS ===

export type ProviderLink = {
  name: string;
  url: string;
};

export type ProviderLogos = {
  light: string;
  dark: string;
  height: number;
  width: number;
};

export type ProviderBrowserType = 'APP_BROWSER' | 'IN_APP_OS_BROWSER' | null;

export type ProviderLimit = {
  minAmount: number;
  maxAmount: number;
  feeFixedRate: number;
  feeDynamicRate: number;
};

/** Fiat buy limits keyed by lowercased fiat short code, then payment method id. */
export type ProviderFiatLimits = Record<string, Record<string, ProviderLimit>>;

export type ProviderLimits = {
  fiat?: ProviderFiatLimits;
};

export type Provider = {
  id: string;
  name: string;
  /**
   * Provider classification from the v2 API: 'native' (first-party
   * integration) or 'aggregator' (third-party redirect). May be absent on
   * responses that predate the v2 type field.
   */
  type?: 'aggregator' | 'native';
  environmentType: string;
  description: string;
  hqAddress: string;
  links: ProviderLink[];
  logos: ProviderLogos;
  supportedCryptoCurrencies?: Record<string, boolean>;
  supportedFiatCurrencies?: Record<string, boolean>;
  supportedPaymentMethods?: Record<string, boolean>;
  limits?: ProviderLimits;
};

// === PAYMENT METHODS ===

export type PaymentMethod = {
  /** Canonical payment method ID (e.g., "/payments/debit-credit-card"). */
  id: string;
  /** Payment type identifier (e.g., "debit-credit-card", "bank-transfer"). */
  paymentType: string;
  /** User-facing name for the payment method. */
  name: string;
  /** Score for sorting payment methods (higher is better). */
  score: number;
  /** Icon identifier for the payment method. */
  icon: string;
  disclaimer?: string;
  /** Delay in minutes (e.g., [5, 10]). */
  delay?: number[];
  pendingOrderDescription?: string;
  isManualBankTransfer?: boolean;
};

// === QUOTES ===

export type QuoteSortBy = 'price' | 'reliability';

export type QuoteCryptoTranslation = {
  id?: string;
  symbol?: string;
  chainId?: string;
};

export type BuyWidget = {
  /** The widget URL to open for the user to complete the purchase. */
  url: string;
  browser?: ProviderBrowserType;
  /** Order ID if already created. */
  orderId?: string | null;
};

export type Quote = {
  /** The provider ID (e.g., "/providers/moonpay"). */
  provider: string;
  quote: {
    /** The amount the user is paying (in fiat for buy, crypto for sell). */
    amountIn: number | string;
    /** The amount the user will receive (in crypto for buy, fiat for sell). */
    amountOut: number | string;
    paymentMethod: string;
    amountOutInFiat?: number;
    cryptoTranslation?: QuoteCryptoTranslation;
    totalFees?: number | string;
    networkFee?: number | string;
    providerFee?: number | string;
    /** @deprecated Use buyWidget instead - it's embedded in the quote response. */
    buyURL?: string;
    buyWidget?: BuyWidget;
  };
  metadata?: {
    /** Reliability score for the provider (0-100). */
    reliability?: number;
    tags?: {
      isBestRate?: boolean;
      isMostReliable?: boolean;
    };
  };
};

export type QuoteError = {
  /** The provider ID that failed. */
  provider: string;
  error?: string;
};

export type QuoteSortOrder = {
  sortBy: QuoteSortBy;
  /** Provider IDs in sorted order. */
  ids: string[];
};

export type QuoteCustomAction = {
  buy: {
    providerId: string;
  };
  paymentMethodId: string;
  supportedPaymentMethodIds: string[];
};

export type QuotesResponse = {
  success: Quote[];
  sorted: QuoteSortOrder[];
  error: QuoteError[];
  customActions: QuoteCustomAction[];
};

/** The type of ramp action: 'buy' or 'sell'. */
export type RampAction = 'buy' | 'sell';

// === REGIONS / COUNTRIES ===

export type CountryPhone = {
  prefix: string;
  placeholder: string;
  template: string;
};

export type SupportedActions = {
  buy: boolean;
  sell: boolean;
};

export type State = {
  /** State identifier (e.g., "/regions/us-ut" or "us-ut"). */
  id?: string;
  name?: string;
  /** ISO state code (e.g., "UT", "NY"). */
  stateId?: string;
  supported?: SupportedActions;
  recommended?: boolean;
};

export type Country = {
  /** ISO-2 country code (e.g., "US", "GB"). */
  isoCode: string;
  /** Country identifier (path or ISO format). Defaults to isoCode if absent. */
  id?: string;
  flag: string;
  name: string;
  phone: CountryPhone;
  currency: string;
  supported: SupportedActions;
  recommended?: boolean;
  states?: State[];
  defaultAmount?: number;
  quickAmounts?: number[];
};

export type UserRegion = {
  country: Country;
  /** The state object if a state was selected, null if only country. */
  state: State | null;
  /** The region code string (e.g., "us-ut" or "fr") used for API calls. */
  regionCode: string;
};

// === TOKENS ===

export type RampsToken = {
  /** The asset identifier in CAIP-19 format (e.g., "eip155:1/erc20:0x..."). */
  assetId: string;
  /** The chain identifier in CAIP-2 format (e.g., "eip155:1"). */
  chainId: string;
  name: string;
  symbol: string;
  decimals: number;
  iconUrl: string;
  tokenSupported: boolean;
};

export type TokensResponse = {
  /** Top/popular tokens for the region. */
  topTokens: RampsToken[];
  /** All available tokens for the region. */
  allTokens: RampsToken[];
};

// === ORDERS ===

export enum RampsOrderStatus {
  Unknown = 'UNKNOWN',
  Precreated = 'PRECREATED',
  Created = 'CREATED',
  Pending = 'PENDING',
  Failed = 'FAILED',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
  IdExpired = 'ID_EXPIRED',
}

export type RampsOrderNetwork = {
  name: string;
  chainId: string;
};

export type RampsOrderCryptoCurrency = {
  assetId?: string;
  name?: string;
  chainId?: string;
  decimals?: number;
  iconUrl?: string;
  symbol: string;
};

export type RampsOrderPaymentMethod = {
  id: string;
  name?: string;
  shortName?: string;
  duration?: string;
  icon?: string;
  isManualBankTransfer?: boolean;
};

export type OrderPaymentDetail = {
  fiatCurrency: string;
  paymentMethod: string;
  fields: { name: string; id: string; value: string }[];
};

export type RampsOrderFiatCurrency = {
  id?: string;
  symbol: string;
  name?: string;
  decimals?: number;
  denomSymbol?: string;
};

/** A unified order type returned from the V2 API. */
export type RampsOrder = {
  id?: string;
  isOnlyLink: boolean;
  provider?: Provider;
  success: boolean;
  cryptoAmount: string | number;
  fiatAmount: number;
  cryptoCurrency?: RampsOrderCryptoCurrency;
  fiatCurrency?: RampsOrderFiatCurrency;
  providerOrderId: string;
  providerOrderLink: string;
  createdAt: number;
  paymentMethod?: RampsOrderPaymentMethod;
  totalFeesFiat: number;
  txHash: string;
  walletAddress: string;
  status: RampsOrderStatus;
  network: RampsOrderNetwork;
  canBeUpdated: boolean;
  idHasExpired: boolean;
  idExpirationDate?: number;
  excludeFromPurchases: boolean;
  timeDescriptionPending: string;
  fiatAmountInUsd?: number;
  feesInUsd?: number;
  region?: string;
  orderType: string;
  exchangeRate?: number;
  pollingSecondsMinimum?: number;
  statusDescription?: string;
  partnerFees?: number;
  networkFees?: number;
  paymentDetails?: OrderPaymentDetail[];
};

// === REQUEST / HOOK PARAM TYPES ===

/**
 * Options accepted by cache-backed controller requests (mirrors the controller's
 * `ExecuteRequestOptions`). `resourceType` is loosened to `string` here to avoid
 * mirroring the controller's internal `ResourceType` union in the stub.
 */
export type ExecuteRequestOptions = {
  forceRefresh?: boolean;
  ttl?: number;
  resourceType?: string;
  isResultCurrent?: () => boolean;
};

/** Params for the `getQuotes` action (mirrors the client store-action type). */
export type GetRampsQuotesParams = {
  region?: string;
  fiat?: string;
  assetId?: string;
  amount: number;
  walletAddress: string;
  paymentMethods?: string[];
  providers?: string[];
  redirectUrl?: string;
  forceRefresh?: boolean;
  ttl?: number;
};

/** Params for registering a pre-created order. */
export type AddPrecreatedOrderParams = {
  orderId: string;
  providerCode: string;
  walletAddress: string;
  chainId?: string;
};

/** Status of an async ramps query. */
export type RampsQueryStatus = 'idle' | 'loading' | 'success' | 'error';
