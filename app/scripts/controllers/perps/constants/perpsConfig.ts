/**
 * Perps feature constants
 */
export const PERPS_CONSTANTS = {
  FeatureFlagKey: 'perpsEnabled',
  FeatureName: 'perps',
  WebsocketTimeout: 5000,
  WebsocketCleanupDelay: 1000,
  BackgroundDisconnectDelay: 20_000,
  ConnectionTimeoutMs: 10_000,
  DefaultMonitoringTimeoutMs: 10_000,
  ConnectionGracePeriodMs: 20_000,
  ConnectionAttemptTimeoutMs: 30_000,
  WebsocketPingTimeoutMs: 5_000,
  ReconnectionCleanupDelayMs: 500,
  ReconnectionDelayAndroidMs: 300,
  ReconnectionDelayIosMs: 100,
  ReconnectionRetryDelayMs: 5_000,
  BalanceUpdateThrottleMs: 15000,
  InitialDataDelayMs: 100,
  DefaultAssetPreviewLimit: 5,
  DefaultMaxLeverage: 3 as number,
  FallbackPriceDisplay: '$---',
  FallbackPercentageDisplay: '--%',
  FallbackDataDisplay: '--',
  ZeroAmountDisplay: '$0',
  ZeroAmountDetailedDisplay: '$0.00',
  RecentActivityLimit: 3,
  FillsLookbackMs: 90 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Withdrawal-specific constants
 */
export const WITHDRAWAL_CONSTANTS = {
  DefaultMinAmount: '1.01',
  DefaultFeeAmount: 1,
  DefaultFeeToken: 'USDC',
} as const;

/**
 * MetaMask fee configuration for Perps trading
 */
export const METAMASK_FEE_CONFIG = {
  DepositFee: 0,
  WithdrawalFee: 0,
} as const;

/**
 * Minimum aggregators for trust
 */
export const PERPS_MIN_AGGREGATORS_FOR_TRUST = 2;

/**
 * Validation thresholds
 */
export const VALIDATION_THRESHOLDS = {
  HighLeverageWarning: 20,
  LimitPriceDifferenceWarning: 0.1,
  PriceDeviation: 0.1,
} as const;

/**
 * Order slippage configuration
 */
export const ORDER_SLIPPAGE_CONFIG = {
  DefaultMarketSlippageBps: 300,
  DefaultTpslSlippageBps: 1000,
  DefaultLimitSlippageBps: 100,
} as const;

/**
 * Performance optimization constants
 */
export const PERFORMANCE_CONFIG = {
  PriceUpdateDebounceMs: 1000,
  ValidationDebounceMs: 300,
  LiquidationPriceDebounceMs: 500,
  NavigationParamsDelayMs: 200,
  TabControlResetDelayMs: 500,
  MarketDataCacheDurationMs: 5 * 60 * 1000,
  AssetMetadataCacheDurationMs: 60 * 60 * 1000,
  MaxLeverageCacheDurationMs: 60 * 60 * 1000,
  FeeDiscountCacheDurationMs: 5 * 60 * 1000,
  PointsCalculationCacheDurationMs: 5 * 60 * 1000,
  LoggingMarkers: {
    SentryPerformance: 'PERPSMARK_SENTRY',
    MetametricsEvents: 'PERPSMARK_METRICS',
    WebsocketPerformance: 'PERPSMARK_SENTRY_WS',
  } as const,
} as const;

/**
 * Leverage slider UI configuration
 */
export const LEVERAGE_SLIDER_CONFIG = {
  TickStepLow: 5,
  TickStepMedium: 10,
  TickStepHigh: 20,
  MaxLeverageLowThreshold: 20,
  MaxLeverageMediumThreshold: 50,
} as const;

export const TP_SL_CONFIG = {
  UsePositionBoundTpsl: true,
} as const;

/**
 * TP/SL View UI configuration
 */
export const TP_SL_VIEW_CONFIG = {
  TakeProfitRoePresets: [10, 25, 50, 100],
  StopLossRoePresets: [-5, -10, -25, -50],
  PriceThrottleMs: 1000,
  MaxInputDigits: 9,
  KeypadCurrencyCode: 'USD_PERPS' as const,
  KeypadDecimals: 5,
} as const;

/**
 * Limit price configuration
 */
export const LIMIT_PRICE_CONFIG = {
  PresetPercentages: [1, 2],
  ModalOpenDelay: 300,
  LongPresets: [-1, -2],
  ShortPresets: [1, 2],
} as const;

/**
 * HyperLiquid order limits
 */
export const HYPERLIQUID_ORDER_LIMITS = {
  MarketOrderLimits: {
    HighLeverage: 15_000_000,
    MediumHighLeverage: 5_000_000,
    MediumLeverage: 2_000_000,
    LowLeverage: 500_000,
  },
  LimitOrderMultiplier: 10,
} as const;

/**
 * Close position configuration
 */
export const CLOSE_POSITION_CONFIG = {
  UsdDecimalPlaces: 2,
  DefaultClosePercentage: 100,
  AmountCalculationPrecision: 6,
  PriceThrottleMs: 3000,
  FallbackTokenDecimals: 18,
} as const;

/**
 * Margin adjustment configuration
 */
export const MARGIN_ADJUSTMENT_CONFIG = {
  LiquidationRiskThreshold: 1.2,
  LiquidationWarningThreshold: 1.5,
  MinAdjustmentAmount: 1,
  CalculationPrecision: 6,
  MarginRemovalSafetyBuffer: 0.1,
  FallbackMaxLeverage: 50,
} as const;

/**
 * Data Lake API configuration
 */
export const DATA_LAKE_API_CONFIG = {
  OrdersEndpoint: 'https://perps.api.cx.metamask.io/api/v1/orders',
} as const;

/**
 * Funding rate display configuration
 */
export const FUNDING_RATE_CONFIG = {
  Decimals: 4,
  ZeroDisplay: '0.0000%',
  PercentageMultiplier: 100,
} as const;

/**
 * Decimal precision configuration
 */
export const DECIMAL_PRECISION_CONFIG = {
  MaxPriceDecimals: 6,
  MaxSignificantFigures: 5,
  FallbackSizeDecimals: 6,
} as const;

/**
 * Development-only configuration
 */
export const DEVELOPMENT_CONFIG = {
  SimulateFeeDiscountAmount: 41,
  SimulateRewardsErrorAmount: 42,
  SimulateRewardsLoadingAmount: 43,
} as const;

/**
 * Home screen configuration
 */
export const HOME_SCREEN_CONFIG = {
  ShowHeaderActionButtons: true,
  PositionsCarouselLimit: 10,
  OrdersCarouselLimit: 10,
  TrendingMarketsLimit: 5,
  RecentActivityLimit: 3,
  CarouselSnapAlignment: 'start' as const,
  CarouselVisibleItems: 1.2,
  DefaultIconSize: 40,
} as const;

/**
 * Market sorting configuration
 */
export const MARKET_SORTING_CONFIG = {
  DefaultSortOptionId: 'volume' as const,
  DefaultDirection: 'desc' as const,
  SortFields: {
    Volume: 'volume',
    PriceChange: 'priceChange',
    OpenInterest: 'openInterest',
    FundingRate: 'fundingRate',
  } as const,
  SortButtonPresets: [
    { field: 'volume', labelKey: 'perps.sort.volume' },
    { field: 'priceChange', labelKey: 'perps.sort.price_change' },
    { field: 'fundingRate', labelKey: 'perps.sort.funding_rate' },
  ] as const,
  SortOptions: [
    {
      id: 'volume',
      labelKey: 'perps.sort.volume',
      field: 'volume',
      direction: 'desc',
    },
    {
      id: 'priceChange',
      labelKey: 'perps.sort.price_change',
      field: 'priceChange',
      direction: 'desc',
    },
    {
      id: 'openInterest',
      labelKey: 'perps.sort.open_interest',
      field: 'openInterest',
      direction: 'desc',
    },
    {
      id: 'fundingRate',
      labelKey: 'perps.sort.funding_rate',
      field: 'fundingRate',
      direction: 'desc',
    },
  ] as const,
} as const;

export type SortOptionId =
  (typeof MARKET_SORTING_CONFIG.SortOptions)[number]['id'];

export type SortButtonPreset =
  (typeof MARKET_SORTING_CONFIG.SortButtonPresets)[number];

/**
 * Learn more card configuration
 */
export const LEARN_MORE_CONFIG = {
  ExternalUrl: 'https://metamask.io/perps',
  TitleKey: 'perps.tutorial.card.title',
  DescriptionKey: 'perps.learn_more.description',
  CtaKey: 'perps.learn_more.cta',
} as const;

/**
 * Support configuration
 */
export const SUPPORT_CONFIG = {
  Url: 'https://support.metamask.io',
  TitleKey: 'perps.support.title',
  DescriptionKey: 'perps.support.description',
} as const;

/**
 * Feedback survey configuration
 */
export const FEEDBACK_CONFIG = {
  Url: 'https://survey.alchemer.com/s3/8649911/MetaMask-Perps-Trading-Feedback',
  TitleKey: 'perps.feedback.title',
} as const;

/**
 * Support article URLs
 */
export const PERPS_SUPPORT_ARTICLES_URLS = {
  AdlUrl:
    'https://support.metamask.io/manage-crypto/trade/perps/leverage-and-liquidation/#what-is-auto-deleveraging-adl',
} as const;

/**
 * Stop loss prompt banner configuration
 */
export const STOP_LOSS_PROMPT_CONFIG = {
  LiquidationDistanceThreshold: 3,
  RoeThreshold: -10,
  MinLossThreshold: -10,
  RoeDebounceMs: 60_000,
  PositionMinAgeMs: 60_000,
  SuggestedStopLossRoe: -50,
} as const;

/**
 * Transactions history configuration
 */
export const PERPS_TRANSACTIONS_HISTORY_CONSTANTS = {
  DefaultFundingHistoryDays: 365,
} as const;
