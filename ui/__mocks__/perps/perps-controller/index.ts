/**
 * Mock package for @metamask/perps-controller
 *
 * This file acts as a local replacement for the @metamask/perps-controller package
 * during development. It re-exports constants and types from local mock files.
 *
 * When the actual perps-controller is integrated, simply remove this mock folder
 * and update the webpack/TypeScript aliases.
 */

import type {
  CaipAccountId,
  CaipChainId,
  CaipAssetId,
  Hex,
} from '@metamask/utils';

/**
 * Perps feature constants
 */
export const PERPS_CONSTANTS = {
  FeatureFlagKey: 'perpsEnabled',
  FeatureName: 'perps', // Constant for Sentry error filtering - enables "feature:perps" dashboard queries
  WebsocketTimeout: 5000, // 5 seconds
  WebsocketCleanupDelay: 1000, // 1 second
  BackgroundDisconnectDelay: 20_000, // 20 seconds delay before disconnecting when app is backgrounded or when user exits perps UX
  ConnectionTimeoutMs: 10_000, // 10 seconds timeout for connection and position loading states
  DefaultMonitoringTimeoutMs: 10_000, // 10 seconds default timeout for data monitoring operations

  // Connection timing constants
  ConnectionGracePeriodMs: 20_000, // 20 seconds grace period before actual disconnection (same as BackgroundDisconnectDelay for semantic clarity)
  ConnectionAttemptTimeoutMs: 30_000, // 30 seconds timeout for connection attempts to prevent indefinite hanging
  WebsocketPingTimeoutMs: 5_000, // 5 seconds timeout for WebSocket health check ping
  ReconnectionCleanupDelayMs: 500, // Platform-agnostic delay to ensure WebSocket is ready
  ReconnectionDelayAndroidMs: 300, // Android-specific reconnection delay for better reliability on slower devices
  ReconnectionDelayIosMs: 100, // iOS-specific reconnection delay for optimal performance
  ReconnectionRetryDelayMs: 5_000, // 5 seconds delay between reconnection attempts

  // Connection manager timing constants
  BalanceUpdateThrottleMs: 15000, // Update at most every 15 seconds to reduce state updates in PerpsConnectionManager
  InitialDataDelayMs: 100, // Delay to allow initial data to load after connection establishment

  DefaultAssetPreviewLimit: 5,
  DefaultMaxLeverage: 3 as number, // Default fallback max leverage when market data is unavailable - conservative default
  FallbackPriceDisplay: '$---', // Display when price data is unavailable
  FallbackPercentageDisplay: '--%', // Display when change data is unavailable
  FallbackDataDisplay: '--', // Display when non-price data is unavailable
  ZeroAmountDisplay: '$0', // Display for zero dollar amounts (e.g., no volume)
  ZeroAmountDetailedDisplay: '$0.00', // Display for zero dollar amounts with decimals

  RecentActivityLimit: 3,

  // Historical data fetching constants
  FillsLookbackMs: 90 * 24 * 60 * 60 * 1000, // 3 months in milliseconds - limits REST API fills fetch
} as const;

/**
 * Withdrawal-specific constants (protocol-agnostic)
 * Note: Protocol-specific values like estimated time should be defined in each protocol's config
 */
export const WITHDRAWAL_CONSTANTS = {
  DefaultMinAmount: '1.01', // Default minimum withdrawal amount in USDC
  DefaultFeeAmount: 1, // Default withdrawal fee in USDC
  DefaultFeeToken: 'USDC', // Default fee token
} as const;

/**
 * MetaMask fee configuration for Perps trading
 * These fees are protocol-agnostic and apply on top of protocol fees
 */
export const METAMASK_FEE_CONFIG = {
  // Deposit/withdrawal fees
  DepositFee: 0, // $0 currently
  WithdrawalFee: 0, // $0 currently

  // Future: Fee configuration will be fetched from API based on:
  // - User tier/volume (for MetaMask fee discounts)
  // - Promotional campaigns
  // - Protocol-specific agreements
  // - MetaMask points/rewards integration
  // Note: Trading fees are now handled by each provider's calculateFees()
  // which returns complete fee breakdown including MetaMask fees
} as const;

/**
 * Minimum number of aggregators (exchanges) a token must be listed on
 * to be considered trustworthy for showing the Perps Discovery Banner.
 * Native tokens (ETH, BNB, etc.) bypass this check.
 */
export const PERPS_MIN_AGGREGATORS_FOR_TRUST = 2;

/**
 * Validation thresholds for UI warnings and checks
 * These values control when warnings are shown to users
 */
export const VALIDATION_THRESHOLDS = {
  // Leverage threshold for warning users about high leverage
  HighLeverageWarning: 20, // Show warning when leverage > 20x

  // Limit price difference threshold (as decimal, 0.1 = 10%)
  LimitPriceDifferenceWarning: 0.1, // Warn if limit price differs by >10% from current price

  // Price deviation threshold (as decimal, 0.1 = 10%)
  PriceDeviation: 0.1, // Warn if perps price deviates by >10% from spot price
} as const;

/**
 * Order slippage configuration
 * Controls default slippage tolerance for different order types
 * Conservative defaults based on HyperLiquid platform interface
 * See: docs/perps/hyperliquid/ORDER-MATCHING-ERRORS.md
 */
export const ORDER_SLIPPAGE_CONFIG = {
  // Market order slippage (basis points)
  // 300 basis points = 3% = 0.03 decimal
  // Conservative default for measured rollout, prevents most IOC failures
  DefaultMarketSlippageBps: 300,

  // TP/SL order slippage (basis points)
  // 1000 basis points = 10% = 0.10 decimal
  // Aligns with HyperLiquid platform default for triggered orders
  DefaultTpslSlippageBps: 1000,

  // Limit order slippage (basis points)
  // 100 basis points = 1% = 0.01 decimal
  // Kept conservative as limit orders rest on book (not IOC/immediate execution)
  DefaultLimitSlippageBps: 100,
} as const;

/**
 * Performance optimization constants
 * These values control debouncing and throttling for better performance
 */
export const PERFORMANCE_CONFIG = {
  // Price updates debounce delay (milliseconds)
  // Batches rapid WebSocket price updates to reduce re-renders
  PriceUpdateDebounceMs: 1000,

  // Order validation debounce delay (milliseconds)
  // Prevents excessive validation calls during rapid form input changes
  ValidationDebounceMs: 300,

  // Liquidation price debounce delay (milliseconds)
  // Prevents excessive liquidation price calls during rapid form input changes
  LiquidationPriceDebounceMs: 500,

  // Navigation params delay (milliseconds)
  // Required for React Navigation to complete state transitions before setting params
  // This ensures navigation context is available when programmatically selecting tabs
  NavigationParamsDelayMs: 200,

  // Tab control reset delay (milliseconds)
  // Delay to reset programmatic tab control after tab switching to prevent render loops
  TabControlResetDelayMs: 500,

  // Market data cache duration (milliseconds)
  // How long to cache market list data before fetching fresh data
  MarketDataCacheDurationMs: 5 * 60 * 1000, // 5 minutes

  // Asset metadata cache duration (milliseconds)
  // How long to cache asset icon validation results
  AssetMetadataCacheDurationMs: 60 * 60 * 1000, // 1 hour

  // Max leverage cache duration (milliseconds)
  // How long to cache max leverage values per asset (leverage rarely changes)
  MaxLeverageCacheDurationMs: 60 * 60 * 1000, // 1 hour

  // Rewards cache durations (milliseconds)
  // How long to cache fee discount data from rewards API
  FeeDiscountCacheDurationMs: 5 * 60 * 1000, // 5 minutes
  // How long to cache points calculation parameters from rewards API
  PointsCalculationCacheDurationMs: 5 * 60 * 1000, // 5 minutes

  /**
   * Performance logging markers for filtering logs during development and debugging
   * These markers help isolate performance-related logs from general application logs
   * Usage: Use in DevLogger calls to easily filter specific performance areas
   * Impact: Development only (uses DevLogger) - zero production performance cost
   *
   * Examples:
   * - Filter Sentry performance logs: `adb logcat | grep PERPSMARK_SENTRY`
   * - Filter MetaMetrics events: `adb logcat | grep PERPSMARK_METRICS`
   * - Filter WebSocket performance: `adb logcat | grep PERPSMARK_WS`
   * - Filter all Perps performance: `adb logcat | grep PERPSMARK_`
   */
  LoggingMarkers: {
    // Sentry performance measurement logs (screen loads, bottom sheets, API timing)
    SentryPerformance: 'PERPSMARK_SENTRY',

    // MetaMetrics event tracking logs (user interactions, business analytics)
    MetametricsEvents: 'PERPSMARK_METRICS',

    // WebSocket performance logs (connection timing, data flow, reconnections)
    WebsocketPerformance: 'PERPSMARK_SENTRY_WS',
  } as const,
} as const;

/**
 * Leverage slider UI configuration
 * Controls the visual and interactive aspects of the leverage slider
 */
export const LEVERAGE_SLIDER_CONFIG = {
  // Step sizes for tick marks based on max leverage
  TickStepLow: 5, // Step size when max leverage <= 20
  TickStepMedium: 10, // Step size when max leverage <= 50
  TickStepHigh: 20, // Step size when max leverage > 50

  // Thresholds for determining tick step size
  MaxLeverageLowThreshold: 20,
  MaxLeverageMediumThreshold: 50,
} as const;

export const TP_SL_CONFIG = {
  UsePositionBoundTpsl: true,
} as const;

/**
 * TP/SL View UI configuration
 * Controls the Take Profit / Stop Loss screen behavior and display options
 */
export const TP_SL_VIEW_CONFIG = {
  // Quick percentage button presets for Take Profit (positive RoE percentages)
  TakeProfitRoePresets: [10, 25, 50, 100], // +10%, +25%, +50%, +100% RoE

  // Quick percentage button presets for Stop Loss (negative RoE percentages)
  StopLossRoePresets: [-5, -10, -25, -50], // -5%, -10%, -25%, -50% RoE

  // WebSocket price update throttle delay (milliseconds)
  // Reduces re-renders by batching price updates in the TP/SL screen
  PriceThrottleMs: 1000,

  // Maximum number of digits allowed in price/percentage input fields
  // Prevents overflow and maintains reasonable input constraints
  MaxInputDigits: 9,

  // Keypad configuration for price inputs
  // USD_PERPS is not a real currency - it's a custom configuration
  // that allows 5 decimal places for crypto prices, overriding the
  // default USD configuration which only allows 2 decimal places
  KeypadCurrencyCode: 'USD_PERPS' as const,
  KeypadDecimals: 5,
} as const;

/**
 * Limit price configuration
 * Controls preset percentages and behavior for limit orders
 */
export const LIMIT_PRICE_CONFIG = {
  // Preset percentage options for quick selection
  PresetPercentages: [1, 2], // Available as both positive and negative

  // Modal opening delay when switching to limit order (milliseconds)
  // Allows order type modal to close smoothly before opening limit price modal
  ModalOpenDelay: 300,

  // Direction-specific preset configurations (Mid/Bid/Ask buttons handled separately)
  LongPresets: [-1, -2], // Buy below market for long orders
  ShortPresets: [1, 2], // Sell above market for short orders
} as const;

/**
 * HyperLiquid order limits based on leverage
 * From: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/contract-specifications
 */
export const HYPERLIQUID_ORDER_LIMITS = {
  // Market orders
  MarketOrderLimits: {
    // $15,000,000 for max leverage >= 25
    HighLeverage: 15_000_000,
    // $5,000,000 for max leverage in [20, 25)
    MediumHighLeverage: 5_000_000,
    // $2,000,000 for max leverage in [10, 20)
    MediumLeverage: 2_000_000,
    // $500,000 for max leverage < 10
    LowLeverage: 500_000,
  },
  // Limit orders are 10x market order limits
  LimitOrderMultiplier: 10,
} as const;

/**
 * Close position configuration
 * Controls behavior and constants specific to position closing
 */
export const CLOSE_POSITION_CONFIG = {
  // Decimal places for USD amount input display
  UsdDecimalPlaces: 2,

  // Default close percentage when opening the close position view
  DefaultClosePercentage: 100,

  // Precision for position size calculations to prevent rounding errors
  AmountCalculationPrecision: 6,

  // Throttle delay for real-time price updates during position closing
  PriceThrottleMs: 3000,

  // Fallback decimal places for tokens without metadata
  FallbackTokenDecimals: 18,
} as const;

/**
 * Margin adjustment configuration
 * Controls behavior for adding/removing margin from positions
 */
export const MARGIN_ADJUSTMENT_CONFIG = {
  // Risk thresholds for margin removal warnings
  // Threshold values represent ratio of (price distance to liquidation) / (liquidation price)
  // Values < 1.0 mean price is dangerously close to liquidation
  LiquidationRiskThreshold: 1.2, // 20% buffer before liquidation - triggers danger state
  LiquidationWarningThreshold: 1.5, // 50% buffer before liquidation - triggers warning state

  // Minimum margin adjustment amount (USD)
  // Prevents dust adjustments and ensures meaningful position changes
  MinAdjustmentAmount: 1,

  // Precision for margin calculations
  // Ensures accurate decimal handling in margin/leverage calculations
  CalculationPrecision: 6,

  // Safety buffer for margin removal to account for HyperLiquid's transfer margin requirement
  // HyperLiquid enforces: transfer_margin_required = max(initial_margin_required, 0.1 * total_position_value)
  // See: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-and-pnl
  MarginRemovalSafetyBuffer: 0.1,

  // Fallback max leverage when market data is unavailable
  // Conservative value to prevent over-removal of margin
  // Most HyperLiquid assets support at least 50x leverage
  FallbackMaxLeverage: 50,
} as const;

/**
 * Data Lake API configuration
 * Endpoints for reporting perps trading activity for notifications
 */
export const DATA_LAKE_API_CONFIG = {
  // Order reporting endpoint - only used for mainnet perps trading
  OrdersEndpoint: 'https://perps.api.cx.metamask.io/api/v1/orders',
} as const;

/**
 * Funding rate display configuration
 * Controls how funding rates are formatted and displayed across the app
 */
export const FUNDING_RATE_CONFIG = {
  // Number of decimal places to display for funding rates
  Decimals: 4,
  // Default display value when funding rate is zero or unavailable
  ZeroDisplay: '0.0000%',
  // Multiplier to convert decimal funding rate to percentage
  PercentageMultiplier: 100,
} as const;

/**
 * Decimal precision configuration
 * Controls maximum decimal places for price and input validation
 */
export const DECIMAL_PRECISION_CONFIG = {
  // Maximum decimal places for price input (matches Hyperliquid limit)
  // Used in TP/SL forms, limit price inputs, and price validation
  MaxPriceDecimals: 6,
  // Maximum significant figures allowed by HyperLiquid API
  // Orders with more than 5 significant figures will be rejected
  MaxSignificantFigures: 5,
  // Defensive fallback for size decimals when market data fails to load
  // Real szDecimals should always come from market data API (varies by asset)
  // Using 6 as safe maximum to prevent crashes (covers most assets)
  // NOTE: This is NOT semantically correct - just a defensive measure
  FallbackSizeDecimals: 6,
} as const;

/**
 * Development-only configuration for testing and debugging
 * These constants are only active when __DEV__ is true
 */
export const DEVELOPMENT_CONFIG = {
  // Magic number to simulate fee discount state (20% discount)
  SimulateFeeDiscountAmount: 41,

  // Magic number to simulate rewards error state (set order amount to this value)
  SimulateRewardsErrorAmount: 42,

  // Magic number to simulate rewards loading state
  SimulateRewardsLoadingAmount: 43,

  // Future: Add other development helpers as needed
} as const;

/**
 * Home screen configuration
 * Controls carousel limits and display settings for the main Perps home screen
 */
export const HOME_SCREEN_CONFIG = {
  // Show action buttons (Add Funds / Withdraw) in header instead of fixed footer
  // Can be controlled via feature flag in the future
  ShowHeaderActionButtons: true,

  // Maximum number of items to show in each carousel
  PositionsCarouselLimit: 10,
  OrdersCarouselLimit: 10,
  TrendingMarketsLimit: 5,
  RecentActivityLimit: 3,

  // Carousel display behavior
  CarouselSnapAlignment: 'start' as const,
  CarouselVisibleItems: 1.2, // Show 1 full item + 20% of next

  // Icon sizes for consistent display across sections
  DefaultIconSize: 40, // Default token icon size for cards and rows
} as const;

/**
 * Market sorting configuration
 * Controls sorting behavior and presets for the trending markets view
 */
export const MARKET_SORTING_CONFIG = {
  // Default sort settings
  DefaultSortOptionId: 'volume' as const,
  DefaultDirection: 'desc' as const,

  // Available sort fields (only includes fields supported by PerpsMarketData)
  SortFields: {
    Volume: 'volume',
    PriceChange: 'priceChange',
    OpenInterest: 'openInterest',
    FundingRate: 'fundingRate',
  } as const,

  // Sort button presets for filter chips (simplified buttons without direction)
  SortButtonPresets: [
    { field: 'volume', labelKey: 'perps.sort.volume' },
    { field: 'priceChange', labelKey: 'perps.sort.price_change' },
    { field: 'fundingRate', labelKey: 'perps.sort.funding_rate' },
  ] as const,

  // Sort options for the bottom sheet
  // Only Price Change can be toggled for direction (similar to trending tokens pattern)
  // Other options (volume, open interest, funding rate) use descending sort only
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

/**
 * Type for valid sort option IDs
 * Derived from SORT_OPTIONS to ensure type safety
 * Valid values: 'volume' | 'priceChange' | 'openInterest' | 'fundingRate'
 */
export type SortOptionId =
  (typeof MARKET_SORTING_CONFIG.SortOptions)[number]['id'];

/**
 * Type for sort button presets (filter chips)
 * Derived from SORT_BUTTON_PRESETS to ensure type safety
 */
export type SortButtonPreset =
  (typeof MARKET_SORTING_CONFIG.SortButtonPresets)[number];

/**
 * Learn more card configuration
 * External resources and content for Perps education
 */
export const LEARN_MORE_CONFIG = {
  ExternalUrl: 'https://metamask.io/perps',
  TitleKey: 'perps.tutorial.card.title',
  DescriptionKey: 'perps.learn_more.description',
  CtaKey: 'perps.learn_more.cta',
} as const;

/**
 * Support configuration
 * Contact support button configuration (matches Settings behavior)
 */
export const SUPPORT_CONFIG = {
  Url: 'https://support.metamask.io',
  TitleKey: 'perps.support.title',
  DescriptionKey: 'perps.support.description',
} as const;

/**
 * Feedback survey configuration
 * External survey for collecting user feedback on Perps trading experience
 */
export const FEEDBACK_CONFIG = {
  Url: 'https://survey.alchemer.com/s3/8649911/MetaMask-Perps-Trading-Feedback',
  TitleKey: 'perps.feedback.title',
} as const;

/**
 * Support article URLs
 * Links to specific MetaMask support articles for Perps features
 */
export const PERPS_SUPPORT_ARTICLES_URLS = {
  AdlUrl:
    'https://support.metamask.io/manage-crypto/trade/perps/leverage-and-liquidation/#what-is-auto-deleveraging-adl',
} as const;

/**
 * Stop loss prompt banner configuration
 * Controls when and how the stop loss prompt banner is displayed
 * Based on TAT-1693 specifications
 */
export const STOP_LOSS_PROMPT_CONFIG = {
  // Distance to liquidation threshold (percentage)
  // Shows "Add margin" banner when position is within this % of liquidation
  LiquidationDistanceThreshold: 3,

  // ROE (Return on Equity) threshold (percentage)
  // Shows "Set stop loss" banner when ROE drops below this value
  RoeThreshold: -10,

  // Minimum loss threshold to show ANY banner (percentage)
  // No banner shown until ROE drops below this value
  MinLossThreshold: -10,

  // Debounce duration for ROE threshold (milliseconds)
  // User must have ROE below threshold for this duration before showing banner
  // Prevents banner from appearing during temporary price fluctuations
  RoeDebounceMs: 60_000, // 60 seconds

  // Minimum position age before showing any banner (milliseconds)
  // Prevents banner from appearing immediately after opening a position
  PositionMinAgeMs: 60_000, // 60 seconds

  // Suggested stop loss ROE percentage
  // When suggesting a stop loss, calculate price at this ROE from entry
  SuggestedStopLossRoe: -50,
} as const;

/**
 * Transactions history configuration
 * Controls history display and data fetching parameters
 */
export const PERPS_TRANSACTIONS_HISTORY_CONSTANTS = {
  /**
   * Default number of days to look back for funding history.
   * HyperLiquid API requires a startTime and returns max 500 records.
   * Using 365 days ensures most users see their complete recent history.
   * Can be increased if users need older funding data.
   */
  DefaultFundingHistoryDays: 365,
} as const;

/* eslint-disable @typescript-eslint/consistent-type-definitions */
// ESLint override: BaseController requires 'type' for Json compatibility, not 'interface'

/**
 * Market data with prices for UI display
 * Protocol-agnostic interface for market information with formatted values
 */

/**
 * Chart-related types for Perps candlestick data
 * These types are protocol-agnostic and used across the codebase.
 */

/**
 * Enum for available candle periods
 * Provides type safety and prevents typos when referencing candle periods
 */
export enum CandlePeriod {
  OneMinute = '1m',
  ThreeMinutes = '3m',
  FiveMinutes = '5m',
  FifteenMinutes = '15m',
  ThirtyMinutes = '30m',
  OneHour = '1h',
  TwoHours = '2h',
  FourHours = '4h',
  EightHours = '8h',
  TwelveHours = '12h',
  OneDay = '1d',
  ThreeDays = '3d',
  OneWeek = '1w',
  OneMonth = '1M',
}

/**
 * Enum for available time durations
 * Provides type safety and prevents typos when referencing durations
 */
export enum TimeDuration {
  OneHour = '1hr',
  OneDay = '1d',
  OneWeek = '1w',
  OneMonth = '1m',
  YearToDate = 'ytd',
  Max = 'max',
}

/**
 * Represents historical candlestick data for a specific symbol and interval
 */
export type CandleData = {
  /** Asset identifier (e.g., 'BTC', 'ETH'). Protocol-agnostic terminology for multi-provider support. */
  symbol: string;
  interval: CandlePeriod;
  candles: CandleStick[];
};

/**
 * Valid time intervals for historical candle data
 * Uses CandlePeriod enum for type safety
 */
export type ValidCandleInterval = CandlePeriod;

// Transaction history types
export type PerpsTransactionType =
  | 'trade'
  | 'order'
  | 'funding'
  | 'deposit'
  | 'withdrawal';

export type PerpsTransactionStatus = 'confirmed' | 'pending' | 'failed';

export type PerpsTransaction = {
  id: string;
  type: PerpsTransactionType;
  symbol: string;
  title: string; // "Opened Long", "Funding Payment"
  subtitle: string; // "2.5 ETH @ $2,850.00"
  timestamp: number;
  status: PerpsTransactionStatus;
  // Type-specific data
  fill?: {
    size: string;
    price: string;
    fee: string;
    side: 'buy' | 'sell';
    realizedPnl?: string;
  };
  order?: {
    orderId: string;
    orderType: OrderType;
    status: Order['status'];
  };
  funding?: {
    amount: string;
    rate: string;
  };
  depositWithdrawal?: {
    amount: string;
    txHash?: string;
  };
};

export type PerpsTransactionFilter = 'trade' | 'order' | 'funding' | 'deposit';

/**
 * Represents a single candlestick data point
 */
export type CandleStick = {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
};

/**
 * Stream channel keys for pausing/resuming WebSocket streams
 * Platform-specific implementations map their channels to these keys
 */
export type PerpsStreamChannelKey =
  | 'prices'
  | 'positions'
  | 'orders'
  | 'orderFills'
  | 'account'
  | 'orderBook'
  | 'candles'
  | 'oiCaps';

/**
 * WebSocket connection states for real-time data management
 */
export enum WebSocketConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnecting = 'disconnecting',
}

/**
 * Raw HyperLiquid ledger update structure from SDK
 * This matches the actual SDK types for userNonFundingLedgerUpdates
 */
export type RawHyperLiquidLedgerUpdate = {
  hash: string;
  time: number;
  delta: {
    type: string;
    usdc?: string;
    coin?: string;
  };
};

// User history item for deposits and withdrawals
export type UserHistoryItem = {
  id: string;
  timestamp: number;
  type: 'deposit' | 'withdrawal';
  amount: string;
  asset: string;
  txHash: string;
  status: 'completed' | 'failed' | 'pending';
  details: {
    source: string;
    bridgeContract?: string;
    recipient?: string;
    blockNumber?: string;
    chainId?: string;
    synthetic?: boolean;
  };
};

// Parameters for getting user history
export type GetUserHistoryParams = {
  startTime?: number;
  endTime?: number;
  accountId?: CaipAccountId;
};

// Trade configuration saved per market per network
export type TradeConfiguration = {
  leverage?: number; // Last used leverage for this market
  // Pending trade configuration (temporary, expires after 5 minutes)
  pendingConfig?: {
    amount?: string; // Order size in USD
    leverage?: number; // Leverage
    takeProfitPrice?: string; // Take profit price
    stopLossPrice?: string; // Stop loss price
    limitPrice?: string; // Limit price (for limit orders)
    orderType?: OrderType; // Market vs limit
    timestamp: number; // When the config was saved (for expiration check)
  };
};

// Order type enumeration
export type OrderType = 'market' | 'limit';

// Market asset type classification (reusable across components)
export type MarketType = 'crypto' | 'equity' | 'commodity' | 'forex';

// Market type filter including 'all' option and combined 'stocks_and_commodities' for UI filtering
export type MarketTypeFilter = MarketType | 'all' | 'stocks_and_commodities';

// Badge type for market badges in UI (used by marketUtils)
export type BadgeType = MarketType | 'experimental' | 'dex';

// Input method for amount entry tracking
export type InputMethod =
  | 'default'
  | 'slider'
  | 'keypad'
  | 'percentage'
  | 'max';

// Trade action type - differentiates first trade on a market from adding to existing position
export type TradeAction = 'create_position' | 'increase_exposure';

// Unified tracking data interface for analytics events (never persisted in state)
// Note: Numeric values are already parsed by hooks (usePerpsOrderFees, etc.) from API responses
export type TrackingData = {
  // Common to all operations
  totalFee: number; // Total fee for the operation (parsed by hooks)
  marketPrice: number; // Market price at operation time (parsed by hooks)
  metamaskFee?: number; // MetaMask fee amount (parsed by hooks)
  metamaskFeeRate?: number; // MetaMask fee rate (parsed by hooks)
  feeDiscountPercentage?: number; // Fee discount percentage (parsed by hooks)
  estimatedPoints?: number; // Estimated reward points (parsed by hooks)

  // Order-specific (used for trade operations)
  marginUsed?: number; // Margin required for this order (calculated by hooks)
  inputMethod?: InputMethod; // How user set the amount
  tradeAction?: TradeAction; // 'create_position' for first trade, 'increase_exposure' for adding to existing

  // Close-specific (used for position close operations)
  receivedAmount?: number; // Amount user receives after close (calculated by hooks)
  realizedPnl?: number; // Realized P&L from close (calculated by hooks)

  // Entry source for analytics (e.g., 'trending' for Trending page discovery)
  source?: string;
};

// TP/SL-specific tracking data for analytics events
export type TPSLTrackingData = {
  direction: 'long' | 'short'; // Position direction
  source: string; // Source of the TP/SL update (e.g., 'tp_sl_view', 'position_card')
  positionSize: number; // Unsigned position size for metrics
  takeProfitPercentage?: number; // Take profit percentage from entry
  stopLossPercentage?: number; // Stop loss percentage from entry
  isEditingExistingPosition?: boolean; // true = editing existing position, false = creating for new order
  entryPrice?: number; // Entry price for percentage calculations
};

// MetaMask Perps API order parameters for PerpsController
export type OrderParams = {
  symbol: string; // Asset identifier (e.g., 'ETH', 'BTC', 'xyz:TSLA')
  isBuy: boolean; // true = BUY order, false = SELL order
  size: string; // Order size as string (derived for validation, provider recalculates from usdAmount)
  orderType: OrderType; // Order type
  price?: string; // Limit price (required for limit orders)
  reduceOnly?: boolean; // Reduce-only flag
  isFullClose?: boolean; // Indicates closing 100% of position (skips $10 minimum validation)
  timeInForce?: 'GTC' | 'IOC' | 'ALO'; // Time in force

  // USD as source of truth (hybrid approach)
  usdAmount?: string; // USD amount (primary source of truth, provider calculates size from this)
  priceAtCalculation?: number; // Price snapshot when size was calculated (for slippage validation)
  maxSlippageBps?: number; // Slippage tolerance in basis points (e.g., 100 = 1%, default if not provided)

  // Advanced order features
  takeProfitPrice?: string; // Take profit price
  stopLossPrice?: string; // Stop loss price
  clientOrderId?: string; // Optional client-provided order ID
  slippage?: number; // Slippage tolerance for market orders (default: ORDER_SLIPPAGE_CONFIG.DefaultMarketSlippageBps / 10000 = 3%)
  grouping?: 'na' | 'normalTpsl' | 'positionTpsl'; // Override grouping (defaults: 'na' without TP/SL, 'normalTpsl' with TP/SL)
  currentPrice?: number; // Current market price (avoids extra API call if provided)
  leverage?: number; // Leverage to apply for the order (e.g., 10 for 10x leverage)
  existingPositionLeverage?: number; // Existing position leverage for validation (protocol constraint)

  // Optional tracking data for MetaMetrics events
  trackingData?: TrackingData;

  // Multi-provider routing (optional: defaults to active/default provider)
  providerId?: PerpsProviderType; // Optional: override active provider for routing
};

export type OrderResult = {
  success?: boolean;
  orderId?: string; // Order ID from exchange
  error?: string;
  filledSize?: string; // Amount filled
  averagePrice?: string; // Average execution price
  providerId?: PerpsProviderType; // Multi-provider: which provider executed this order (injected by aggregator)
};

export type Position = {
  symbol: string; // Asset identifier (e.g., 'ETH', 'BTC', 'xyz:TSLA')
  size: string; // Signed position size (+ = LONG, - = SHORT)
  entryPrice: string; // Average entry price
  positionValue: string; // Total position value in USD
  unrealizedPnl: string; // Unrealized profit/loss
  marginUsed: string; // Margin currently used for this position
  leverage: {
    type: 'isolated' | 'cross'; // Margin type
    value: number; // Leverage multiplier
    rawUsd?: string; // USD amount (for isolated margin)
  };
  liquidationPrice: string | null; // Liquidation price (null if no risk)
  maxLeverage: number; // Maximum allowed leverage for this asset
  returnOnEquity: string; // ROE percentage
  cumulativeFunding: {
    // Funding payments history
    allTime: string; // Total funding since account opening
    sinceOpen: string; // Funding since position opened
    sinceChange: string; // Funding since last size change
  };
  takeProfitPrice?: string; // Take profit price (if set)
  stopLossPrice?: string; // Stop loss price (if set)
  takeProfitCount: number; // Take profit count, how many tps can affect the position
  stopLossCount: number; // Stop loss count, how many sls can affect the position
  providerId?: PerpsProviderType; // Multi-provider: which provider holds this position (injected by aggregator)
};

// Using 'type' instead of 'interface' for BaseController Json compatibility
export type AccountState = {
  availableBalance: string; // Based on HyperLiquid: withdrawable
  totalBalance: string; // Based on HyperLiquid: accountValue
  marginUsed: string; // Based on HyperLiquid: marginUsed
  unrealizedPnl: string; // Based on HyperLiquid: unrealizedPnl
  returnOnEquity: string; // Based on HyperLiquid: returnOnEquity adjusted for weighted margin
  /**
   * Per-sub-account balance breakdown (protocol-specific, optional)
   * Maps sub-account identifier to its balance details.
   *
   * Protocol examples:
   * - HyperLiquid HIP-3: '' or 'main' (main DEX), 'xyz' (HIP-3 builder DEX)
   * - dYdX: Sub-account numbers (e.g., '0', '1', '2')
   * - Other protocols: Vault IDs, pool IDs, margin account IDs, etc.
   *
   * Key: Sub-account identifier (protocol-specific string)
   * Value: Balance details for that sub-account
   */
  subAccountBreakdown?: Record<
    string,
    {
      availableBalance: string;
      totalBalance: string;
    }
  >;
  providerId?: PerpsProviderType; // Multi-provider: which provider this account state is from (injected by aggregator)
};

export type ClosePositionParams = {
  symbol: string; // Asset identifier to close (e.g., 'ETH', 'BTC', 'xyz:TSLA')
  size?: string; // Size to close (omit for full close)
  orderType?: OrderType; // Close order type (default: market)
  price?: string; // Limit price (required for limit close)
  currentPrice?: number; // Current market price for validation

  // USD as source of truth (hybrid approach - same as OrderParams)
  usdAmount?: string; // USD amount (primary source of truth, provider calculates size from this)
  priceAtCalculation?: number; // Price snapshot when size was calculated (for slippage validation)
  maxSlippageBps?: number; // Slippage tolerance in basis points (e.g., 100 = 1%, default if not provided)

  // Optional tracking data for MetaMetrics events
  trackingData?: TrackingData;

  // Multi-provider routing (optional: defaults to active/default provider)
  providerId?: PerpsProviderType; // Optional: override active provider for routing
};

export type ClosePositionsParams = {
  symbols?: string[]; // Optional: specific symbols to close (omit or empty array to close all)
  closeAll?: boolean; // Explicitly close all positions
};

export type ClosePositionsResult = {
  success: boolean; // Overall success (true if at least one position closed)
  successCount: number; // Number of positions closed successfully
  failureCount: number; // Number of positions that failed to close
  results: {
    symbol: string;
    success: boolean;
    error?: string;
  }[];
};

export type UpdateMarginParams = {
  symbol: string; // Asset identifier (e.g., 'BTC', 'ETH', 'xyz:TSLA')
  amount: string; // Amount to adjust as string (positive = add, negative = remove)
  providerId?: PerpsProviderType; // Multi-provider: optional provider override for routing
};

export type MarginResult = {
  success: boolean;
  error?: string;
};

export type FlipPositionParams = {
  symbol: string; // Asset identifier to flip (e.g., 'BTC', 'ETH', 'xyz:TSLA')
  position: Position; // Current position to flip
};

export type InitializeResult = {
  success: boolean;
  error?: string;
  chainId?: string;
};

export type ReadyToTradeResult = {
  ready: boolean;
  error?: string;
  walletConnected?: boolean;
  networkSupported?: boolean;
};

export type DisconnectResult = {
  success: boolean;
  error?: string;
};

export type MarketInfo = {
  name: string; // HyperLiquid: universe name (asset symbol)
  szDecimals: number; // HyperLiquid: size decimals
  maxLeverage: number; // HyperLiquid: max leverage
  marginTableId: number; // HyperLiquid: margin requirements table ID
  onlyIsolated?: true; // HyperLiquid: isolated margin only (optional, only when true)
  isDelisted?: true; // HyperLiquid: delisted status (optional, only when true)
  minimumOrderSize?: number; // Minimum order size in USD (protocol-specific)
  providerId?: PerpsProviderType; // Multi-provider: which provider this market comes from (injected by aggregator)
};

/**
 * Market data with prices for UI display
 * Protocol-agnostic interface for market information with formatted values
 */
export type PerpsMarketData = {
  /**
   * Token symbol (e.g., 'BTC', 'ETH')
   */
  symbol: string;
  /**
   * Full token name (e.g., 'Bitcoin', 'Ethereum')
   */
  name: string;
  /**
   * Maximum leverage available as formatted string (e.g., '40x', '25x')
   */
  maxLeverage: string;
  /**
   * Current price as formatted string (e.g., '$50,000.00')
   */
  price: string;
  /**
   * 24h price change as formatted string (e.g., '+$1,250.00', '-$850.50')
   */
  change24h: string;
  /**
   * 24h price change percentage as formatted string (e.g., '+2.5%', '-1.8%')
   */
  change24hPercent: string;
  /**
   * Trading volume as formatted string (e.g., '$1.2B', '$850M')
   */
  volume: string;
  /**
   * Open interest as formatted string (e.g., '$24.5M', '$1.2B')
   */
  openInterest?: string;
  /**
   * Next funding time in milliseconds since epoch (optional, market-specific)
   */
  nextFundingTime?: number;
  /**
   * Funding interval in hours (optional, market-specific)
   */
  fundingIntervalHours?: number;
  /**
   * Current funding rate as decimal (optional, from predictedFundings API)
   */
  fundingRate?: number;
  /**
   * Market source DEX identifier (HIP-3 support)
   * - null or undefined: Main validator DEX
   * - "xyz", "abc", etc: HIP-3 builder-deployed DEX
   */
  marketSource?: string | null;
  /**
   * Market asset type classification (optional)
   * - crypto: Cryptocurrency (default for most markets)
   * - equity: Stock/equity markets (HIP-3)
   * - commodity: Commodity markets (HIP-3)
   * - forex: Foreign exchange pairs (HIP-3)
   */
  marketType?: MarketType;
  /**
   * Multi-provider: which provider this market data comes from (injected by aggregator)
   */
  providerId?: PerpsProviderType;
};

export type ToggleTestnetResult = {
  success: boolean;
  isTestnet: boolean;
  error?: string;
};

export type AssetRoute = {
  assetId: CaipAssetId; // CAIP asset ID (e.g., "eip155:42161/erc20:0xaf88.../default")
  chainId: CaipChainId; // CAIP-2 chain ID where the bridge contract is located
  contractAddress: Hex; // Bridge contract address for deposits/withdrawals
  constraints?: {
    minAmount?: string; // Minimum deposit/withdrawal amount
    maxAmount?: string; // Maximum deposit/withdrawal amount
    estimatedTime?: string; // Estimated processing time (formatted string - deprecated, use estimatedMinutes)
    estimatedMinutes?: number; // Estimated processing time in minutes (raw value for UI formatting)
    fees?: {
      fixed?: number; // Fixed fee amount (e.g., 1 for 1 token)
      percentage?: number; // Percentage fee (e.g., 0.05 for 0.05%)
      token?: string; // Fee token symbol (e.g., 'USDC', 'ETH')
    };
  };
};

export type SwitchProviderResult = {
  success: boolean;
  providerId: PerpsActiveProviderMode;
  error?: string;
};

export type CancelOrderParams = {
  orderId: string; // Order ID to cancel
  symbol: string; // Asset identifier (e.g., 'BTC', 'ETH', 'xyz:TSLA')
  providerId?: PerpsProviderType; // Multi-provider: optional provider override for routing
};

export type CancelOrderResult = {
  success: boolean;
  orderId?: string; // Cancelled order ID
  error?: string;
  providerId?: PerpsProviderType; // Multi-provider: source provider identifier
};

export type BatchCancelOrdersParams = {
  orderId: string;
  symbol: string;
}[];

export type CancelOrdersParams = {
  symbols?: string[]; // Optional: specific symbols (omit to cancel all orders)
  orderIds?: string[]; // Optional: specific order IDs (omit to cancel all orders for specified coins)
  cancelAll?: boolean; // Explicitly cancel all orders
};

export type CancelOrdersResult = {
  success: boolean; // Overall success (true if at least one order cancelled)
  successCount: number; // Number of orders cancelled successfully
  failureCount: number; // Number of orders that failed to cancel
  results: {
    orderId: string;
    symbol: string;
    success: boolean;
    error?: string;
  }[];
};

export type EditOrderParams = {
  orderId: string | number; // Order ID or client order ID to modify
  newOrder: OrderParams; // New order parameters
};

export type DepositParams = {
  amount: string; // Amount to deposit
  assetId: CaipAssetId; // Asset to deposit (required for validation)
  fromChainId?: CaipChainId; // Source chain (defaults to current network)
  toChainId?: CaipChainId; // Destination chain (defaults to HyperLiquid Arbitrum)
  recipient?: Hex; // Recipient address (defaults to selected account)
};

export type DepositResult = {
  success: boolean;
  txHash?: string;
  error?: string;
};

// Enhanced deposit flow state types for multi-step deposits
export type DepositStatus =
  | 'idle' // No deposit in progress
  | 'preparing' // Analyzing route & preparing transactions
  | 'swapping' // Converting token (e.g., ETH → USDC)
  | 'bridging' // Cross-chain transfer
  | 'depositing' // Final deposit to HyperLiquid
  | 'success' // Deposit completed successfully
  | 'error'; // Deposit failed at any step

export type DepositFlowType =
  | 'direct' // Same chain, same token (USDC on Arbitrum)
  | 'swap' // Same chain, different token (ETH → USDC)
  | 'bridge' // Different chain, same token (USDC on Ethereum → Arbitrum)
  | 'swap_bridge'; // Different chain, different token (ETH on Ethereum → USDC on Arbitrum)

export type DepositStepInfo = {
  totalSteps: number; // Total number of steps in this flow
  currentStep: number; // Current step (0-based index)
  stepNames: string[]; // Human-readable step names
  stepTxHashes?: string[]; // Transaction hashes for each completed step
};

export type WithdrawParams = {
  amount: string; // Amount to withdraw
  destination?: Hex; // Destination address (optional, defaults to current account)
  assetId?: CaipAssetId; // Asset to withdraw (defaults to USDC)
  providerId?: PerpsProviderType; // Multi-provider: optional provider override for routing
};

export type WithdrawResult = {
  success: boolean;
  txHash?: string;
  error?: string;
  withdrawalId?: string; // Unique ID for tracking
  estimatedArrivalTime?: number; // Provider-specific arrival time
};

export type TransferBetweenDexsParams = {
  sourceDex: string; // Source DEX name ('' = main DEX, 'xyz' = HIP-3 DEX)
  destinationDex: string; // Destination DEX name ('' = main DEX, 'xyz' = HIP-3 DEX)
  amount: string; // USDC amount to transfer
};

export type TransferBetweenDexsResult = {
  success: boolean;
  txHash?: string;
  error?: string;
};

export type GetHistoricalPortfolioParams = {
  accountId?: CaipAccountId; // Optional: defaults to selected account
};

export type HistoricalPortfolioResult = {
  accountValue1dAgo: string;
  timestamp: number;
};

export type LiveDataConfig = {
  priceThrottleMs?: number; // ms between price updates (default: 2000)
  positionThrottleMs?: number; // ms between position updates (default: 5000)
  maxUpdatesPerSecond?: number; // hard limit to prevent UI blocking
};

export type PerpsControllerConfig = {
  /**
   * Fallback blocked regions to use when RemoteFeatureFlagController fails to fetch.
   * The fallback is set by default if defined and replaced with remote block list once available.
   */
  fallbackBlockedRegions?: string[];
  /**
   * Fallback HIP-3 equity perps master switch to use when RemoteFeatureFlagController fails to fetch.
   * Controls whether HIP-3 (builder-deployed) DEXs are enabled.
   * The fallback is set by default if defined and replaced with remote feature flag once available.
   */
  fallbackHip3Enabled?: boolean;
  /**
   * Fallback HIP-3 market allowlist to use when RemoteFeatureFlagController fails to fetch.
   * Empty array = enable all markets (discovery mode), non-empty = allowlist specific markets.
   * Supports wildcards: "xyz:*" (all xyz markets), "xyz" (shorthand for "xyz:*"), "BTC" (main DEX market).
   * Only applies when HIP-3 is enabled.
   * The fallback is set by default if defined and replaced with remote feature flag once available.
   */
  fallbackHip3AllowlistMarkets?: string[];
  /**
   * Fallback HIP-3 market blocklist to use when RemoteFeatureFlagController fails to fetch.
   * Empty array = no blocking, non-empty = block specific markets.
   * Supports wildcards: "xyz:*" (block all xyz markets), "xyz" (shorthand for "xyz:*"), "BTC" (block main DEX market).
   * Always applied regardless of HIP-3 enabled state.
   * The fallback is set by default if defined and replaced with remote feature flag once available.
   */
  fallbackHip3BlocklistMarkets?: string[];
};

export type PriceUpdate = {
  symbol: string; // Asset identifier (e.g., 'BTC', 'ETH', 'xyz:TSLA')
  price: string; // Current mid price (average of best bid and ask)
  timestamp: number; // Update timestamp
  percentChange24h?: string; // 24h price change percentage
  // Order book data (only available when includeOrderBook is true)
  bestBid?: string; // Best bid price (highest price buyers are willing to pay)
  bestAsk?: string; // Best ask price (lowest price sellers are willing to accept)
  spread?: string; // Ask - Bid spread
  markPrice?: string; // Mark price from oracle (used for liquidations)
  // Market data (only available when includeMarketData is true)
  funding?: number; // Current funding rate
  openInterest?: number; // Open interest in USD
  volume24h?: number; // 24h trading volume in USD
  providerId?: PerpsProviderType; // Multi-provider: price source (injected by aggregator)
};

export type OrderFill = {
  orderId: string; // Order ID that was filled
  symbol: string; // Asset symbol
  side: string; // Normalized order side ('buy' or 'sell')
  size: string; // Fill size
  price: string; // Fill price
  pnl: string; // PNL
  direction: string; // Direction of the fill
  fee: string; // Fee paid
  feeToken: string; // Fee token symbol
  timestamp: number; // Fill timestamp
  startPosition?: string; // Start position
  success?: boolean; // Whether the order was filled successfully
  liquidation?: {
    liquidatedUser: string; // Address of the liquidated user. liquidatedUser isn't always the current user. It can also mean the fill filled another user's liquidation.
    markPx: string; // Mark price at liquidation
    method: string; // Liquidation method (e.g., 'market')
  };
  orderType?: 'take_profit' | 'stop_loss' | 'liquidation' | 'regular';
  detailedOrderType?: string; // Original order type from exchange
  providerId?: PerpsProviderType; // Multi-provider: which provider this fill occurred on (injected by aggregator)
};

// Parameter interfaces - all fully optional for better UX
export type GetPositionsParams = {
  accountId?: CaipAccountId; // Optional: defaults to selected account
  includeHistory?: boolean; // Optional: include historical positions
  skipCache?: boolean; // Optional: bypass WebSocket cache and force API call (default: false)
};

export type GetAccountStateParams = {
  accountId?: CaipAccountId; // Optional: defaults to selected account
  source?: string; // Optional: source of the call for tracing (e.g., 'health_check', 'initial_connection')
};

export type GetOrderFillsParams = {
  accountId?: CaipAccountId; // Optional: defaults to selected account
  user?: Hex; // Optional: user address (defaults to selected account)
  startTime?: number; // Optional: start timestamp (Unix milliseconds)
  endTime?: number; // Optional: end timestamp (Unix milliseconds)
  limit?: number; // Optional: max number of results for pagination
  aggregateByTime?: boolean; // Optional: aggregate by time
};

export type GetOrdersParams = {
  accountId?: CaipAccountId; // Optional: defaults to selected account
  startTime?: number; // Optional: start timestamp (Unix milliseconds)
  endTime?: number; // Optional: end timestamp (Unix milliseconds)
  limit?: number; // Optional: max number of results for pagination
  offset?: number; // Optional: offset for pagination
  skipCache?: boolean; // Optional: bypass WebSocket cache and force API call (default: false)
};

export type GetFundingParams = {
  accountId?: CaipAccountId; // Optional: defaults to selected account
  startTime?: number; // Optional: start timestamp (Unix milliseconds)
  endTime?: number; // Optional: end timestamp (Unix milliseconds)
  limit?: number; // Optional: max number of results for pagination
  offset?: number; // Optional: offset for pagination
};

export type GetSupportedPathsParams = {
  isTestnet?: boolean; // Optional: override current testnet state
  assetId?: CaipAssetId; // Optional: filter by specific asset
  symbol?: string; // Optional: filter by asset symbol (e.g., 'USDC')
  chainId?: CaipChainId; // Optional: filter by chain (CAIP-2 format)
};

export type GetAvailableDexsParams = object;

export type GetMarketsParams = {
  symbols?: string[]; // Optional symbol filter (e.g., ['BTC', 'xyz:XYZ100'])
  dex?: string; // HyperLiquid HIP-3: DEX name (empty string '' or undefined for main DEX). Other protocols: ignored.
  skipFilters?: boolean; // Skip market filtering (both allowlist and blocklist, default: false). When true, returns all markets without filtering.
  readOnly?: boolean; // Lightweight mode: skip full initialization, only fetch market metadata (no wallet/WebSocket needed). Only main DEX markets returned. Use for discovery use cases like checking if a perps market exists.
};

export type SubscribePricesParams = {
  symbols: string[];
  callback: (prices: PriceUpdate[]) => void;
  throttleMs?: number; // Future: per-subscription throttling
  includeOrderBook?: boolean; // Optional: include bid/ask data from L2 book
  includeMarketData?: boolean; // Optional: include funding, open interest, volume data
};

export type SubscribePositionsParams = {
  callback: (positions: Position[]) => void;
  accountId?: CaipAccountId; // Optional: defaults to selected account
  includeHistory?: boolean; // Future: include historical data
};

export type SubscribeOrderFillsParams = {
  callback: (fills: OrderFill[], isSnapshot?: boolean) => void;
  accountId?: CaipAccountId; // Optional: defaults to selected account
  since?: number; // Future: only fills after timestamp
};

export type SubscribeOrdersParams = {
  callback: (orders: Order[]) => void;
  accountId?: CaipAccountId; // Optional: defaults to selected account
  includeHistory?: boolean; // Optional: include filled/canceled orders
};

export type SubscribeAccountParams = {
  callback: (account: AccountState) => void;
  accountId?: CaipAccountId; // Optional: defaults to selected account
};

export type SubscribeOICapsParams = {
  callback: (caps: string[]) => void;
  accountId?: CaipAccountId; // Optional: defaults to selected account
};

export type SubscribeCandlesParams = {
  symbol: string;
  interval: CandlePeriod;
  duration?: TimeDuration;
  callback: (data: CandleData) => void;
  onError?: (error: Error) => void;
};

/**
 * Single price level in the order book
 */
export type OrderBookLevel = {
  /** Price at this level */
  price: string;
  /** Size at this level (in base asset) */
  size: string;
  /** Cumulative size up to and including this level */
  total: string;
  /** Notional value in USD */
  notional: string;
  /** Cumulative notional up to and including this level */
  totalNotional: string;
};

/**
 * Full order book data with multiple price levels
 */
export type OrderBookData = {
  /** Bid levels (buy orders) - highest price first */
  bids: OrderBookLevel[];
  /** Ask levels (sell orders) - lowest price first */
  asks: OrderBookLevel[];
  /** Spread between best bid and best ask */
  spread: string;
  /** Spread as a percentage of mid price */
  spreadPercentage: string;
  /** Mid price (average of best bid and best ask) */
  midPrice: string;
  /** Timestamp of last update */
  lastUpdated: number;
  /** Maximum total size across all levels (for scaling depth bars) */
  maxTotal: string;
};

export type SubscribeOrderBookParams = {
  /** Symbol to subscribe to (e.g., 'BTC', 'ETH') */
  symbol: string;
  /** Number of levels to return per side (default: 10) */
  levels?: number;
  /** Price aggregation significant figures (2-5, default: 5). Higher = finer granularity */
  nSigFigs?: 2 | 3 | 4 | 5;
  /** Mantissa for aggregation when nSigFigs is 5 (2 or 5). Controls finest price increments */
  mantissa?: 2 | 5;
  /** Callback function receiving order book updates */
  callback: (orderBook: OrderBookData) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
};

export type LiquidationPriceParams = {
  entryPrice: number;
  leverage: number;
  direction: 'long' | 'short';
  positionSize?: number; // Optional: for more accurate calculations
  marginType?: 'isolated' | 'cross'; // Optional: defaults to isolated
  asset?: string; // Optional: for asset-specific maintenance margins
};

export type MaintenanceMarginParams = {
  asset: string;
  positionSize?: number; // Optional: for tiered margin systems
};

export type FeeCalculationParams = {
  orderType: 'market' | 'limit';
  isMaker?: boolean;
  amount?: string;
  symbol: string; // Required: Asset identifier for HIP-3 fee calculation (e.g., 'BTC', 'xyz:TSLA')
};

export type FeeCalculationResult = {
  // Total fees (protocol + MetaMask)
  feeRate?: number; // Total fee rate as decimal (e.g., 0.00145 for 0.145%), undefined when unavailable
  feeAmount?: number; // Total fee amount in USD (when amount is provided)

  // Protocol-specific base fees
  protocolFeeRate?: number; // Protocol fee rate (e.g., 0.00045 for HyperLiquid taker), undefined when unavailable
  protocolFeeAmount?: number; // Protocol fee amount in USD

  // MetaMask builder/revenue fee
  metamaskFeeRate?: number; // MetaMask fee rate (e.g., 0.001 for 0.1%), undefined when unavailable
  metamaskFeeAmount?: number; // MetaMask fee amount in USD

  // Optional detailed breakdown for transparency
  breakdown?: {
    baseFeeRate: number;
    volumeTier?: string;
    volumeDiscount?: number;
    stakingDiscount?: number;
  };
};

export type UpdatePositionTPSLParams = {
  symbol: string; // Asset identifier (e.g., 'BTC', 'ETH', 'xyz:TSLA')
  takeProfitPrice?: string; // Optional: undefined to remove
  stopLossPrice?: string; // Optional: undefined to remove
  // Optional tracking data for MetaMetrics events
  trackingData?: TPSLTrackingData;
  providerId?: PerpsProviderType; // Multi-provider: optional provider override for routing
  /**
   * Optional live position data from WebSocket.
   * If provided, skips the REST API position fetch (avoids rate limiting issues).
   * If not provided, falls back to fetching positions via REST API.
   */
  position?: Position;
};

export type Order = {
  orderId: string; // Order ID
  symbol: string; // Asset symbol (e.g., 'ETH', 'BTC')
  side: 'buy' | 'sell'; // Normalized order side
  orderType: OrderType; // Order type (market/limit)
  size: string; // Order size
  originalSize: string; // Original order size
  price: string; // Order price (for limit orders)
  filledSize: string; // Amount filled
  remainingSize: string; // Amount remaining
  status: 'open' | 'filled' | 'canceled' | 'rejected' | 'triggered' | 'queued'; // Normalized status
  timestamp: number; // Order timestamp
  lastUpdated?: number; // Last status update timestamp (optional - not provided by all APIs)
  // TODO: Consider creating separate type for OpenOrders (UI Orders) potentially if optional properties muddy up the original Order type
  takeProfitPrice?: string; // Take profit price (if set)
  stopLossPrice?: string; // Stop loss price (if set)
  stopLossOrderId?: string; // Stop loss order ID
  takeProfitOrderId?: string; // Take profit order ID
  detailedOrderType?: string; // Full order type from exchange (e.g., 'Take Profit Limit', 'Stop Market')
  isTrigger?: boolean; // Whether this is a trigger order (TP/SL)
  reduceOnly?: boolean; // Whether this is a reduce-only order
  triggerPrice?: string; // Trigger condition price for trigger orders (e.g., TP/SL trigger level)
  providerId?: PerpsProviderType; // Multi-provider: which provider this order is on (injected by aggregator)
};

export type Funding = {
  symbol: string; // Asset symbol (e.g., 'ETH', 'BTC')
  amountUsd: string; // Funding amount in USD (positive = received, negative = paid)
  rate: string; // Funding rate applied
  timestamp: number; // Funding payment timestamp
  transactionHash?: string; // Optional transaction hash
};

export type PerpsProvider = {
  readonly protocolId: string;

  // Unified asset and route information
  getDepositRoutes(params?: GetSupportedPathsParams): AssetRoute[]; // Assets and their deposit routes
  getWithdrawalRoutes(params?: GetSupportedPathsParams): AssetRoute[]; // Assets and their withdrawal routes

  // Trading operations → Redux (persisted, optimistic updates)
  placeOrder(params: OrderParams): Promise<OrderResult>;
  editOrder(params: EditOrderParams): Promise<OrderResult>;
  cancelOrder(params: CancelOrderParams): Promise<CancelOrderResult>;
  cancelOrders?(params: BatchCancelOrdersParams): Promise<CancelOrdersResult>; // Optional: batch cancel for protocols that support it
  closePosition(params: ClosePositionParams): Promise<OrderResult>;
  closePositions?(params: ClosePositionsParams): Promise<ClosePositionsResult>; // Optional: batch close for protocols that support it
  updatePositionTPSL(params: UpdatePositionTPSLParams): Promise<OrderResult>;
  updateMargin(params: UpdateMarginParams): Promise<MarginResult>;
  getPositions(params?: GetPositionsParams): Promise<Position[]>;
  getAccountState(params?: GetAccountStateParams): Promise<AccountState>;
  getMarkets(params?: GetMarketsParams): Promise<MarketInfo[]>;
  getMarketDataWithPrices(): Promise<PerpsMarketData[]>;
  withdraw(params: WithdrawParams): Promise<WithdrawResult>; // API operation - stays in provider
  // Note: deposit() is handled by PerpsController routing (blockchain operation)
  validateDeposit(
    params: DepositParams,
  ): Promise<{ isValid: boolean; error?: string }>; // Protocol-specific deposit validation
  validateOrder(
    params: OrderParams,
  ): Promise<{ isValid: boolean; error?: string }>; // Protocol-specific order validation
  validateClosePosition(
    params: ClosePositionParams,
  ): Promise<{ isValid: boolean; error?: string }>; // Protocol-specific position close validation
  validateWithdrawal(
    params: WithdrawParams,
  ): Promise<{ isValid: boolean; error?: string }>; // Protocol-specific withdrawal validation

  // Historical data operations
  /**
   * Historical trade fills - actual executed trades with exact prices and fees.
   * Purpose: Track what actually happened when orders were executed.
   * Example: Market long 1 ETH @ $50,000 → OrderFill with exact execution price and fees
   */
  getOrderFills(params?: GetOrderFillsParams): Promise<OrderFill[]>;

  /**
   * Get historical portfolio data.
   * Purpose: Retrieve account value from previous periods for PnL tracking
   * Example: Get account value from yesterday to calculate 24h percentage change
   *
   * @param params - Optional parameters for historical portfolio retrieval
   */
  getHistoricalPortfolio(
    params?: GetHistoricalPortfolioParams,
  ): Promise<HistoricalPortfolioResult>;

  /**
   * Historical order lifecycle - order placement, modifications, and status changes.
   * Purpose: Track the complete journey of orders from request to completion.
   * Example: Limit buy 1 ETH @ $48,000 → Order with status 'open' → 'filled' when executed
   */
  getOrders(params?: GetOrdersParams): Promise<Order[]>;

  /**
   * Currently active open orders (real-time status).
   * Purpose: Show orders that are currently open/pending execution (not historical states).
   * Different from getOrders() which returns complete historical order lifecycle.
   * Example: Shows only orders that are actually open right now in the exchange.
   */
  getOpenOrders(params?: GetOrdersParams): Promise<Order[]>;

  /**
   * Historical funding payments - periodic costs/rewards for holding positions.
   * Purpose: Track ongoing expenses and income from position maintenance.
   * Example: Holding long ETH position → Funding payment of -$5.00 (you pay the funding)
   */
  getFunding(params?: GetFundingParams): Promise<Funding[]>;

  /**
   * Get user non-funding ledger updates (deposits, transfers, withdrawals)
   */
  getUserNonFundingLedgerUpdates(params?: {
    accountId?: string;
    startTime?: number;
    endTime?: number;
  }): Promise<RawHyperLiquidLedgerUpdate[]>;

  /**
   * Get user history (deposits, withdrawals, transfers)
   */
  getUserHistory(params?: {
    accountId?: CaipAccountId;
    startTime?: number;
    endTime?: number;
  }): Promise<UserHistoryItem[]>;

  // Protocol-specific calculations
  calculateLiquidationPrice(params: LiquidationPriceParams): Promise<string>;
  calculateMaintenanceMargin(params: MaintenanceMarginParams): Promise<number>;
  getMaxLeverage(asset: string): Promise<number>;
  calculateFees(params: FeeCalculationParams): Promise<FeeCalculationResult>;

  // Live data subscriptions → Direct UI (NO Redux, maximum speed)
  subscribeToPrices(params: SubscribePricesParams): () => void;
  subscribeToPositions(params: SubscribePositionsParams): () => void;
  subscribeToOrderFills(params: SubscribeOrderFillsParams): () => void;
  subscribeToOrders(params: SubscribeOrdersParams): () => void;
  subscribeToAccount(params: SubscribeAccountParams): () => void;
  subscribeToOICaps(params: SubscribeOICapsParams): () => void;
  subscribeToCandles(params: SubscribeCandlesParams): () => void;
  subscribeToOrderBook(params: SubscribeOrderBookParams): () => void;

  // Live data configuration
  setLiveDataConfig(config: Partial<LiveDataConfig>): void;

  // Connection management
  toggleTestnet(): Promise<ToggleTestnetResult>;
  initialize(): Promise<InitializeResult>;
  isReadyToTrade(): Promise<ReadyToTradeResult>;
  disconnect(): Promise<DisconnectResult>;
  ping(timeoutMs?: number): Promise<void>; // Lightweight WebSocket health check with configurable timeout
  getWebSocketConnectionState?(): WebSocketConnectionState; // Optional: get current WebSocket connection state
  subscribeToConnectionState?(
    listener: (
      state: WebSocketConnectionState,
      reconnectionAttempt: number,
    ) => void,
  ): () => void; // Optional: subscribe to WebSocket connection state changes
  reconnect?(): Promise<void>; // Optional: manually trigger WebSocket reconnection

  // Block explorer
  getBlockExplorerUrl(address?: string): string;

  // Fee discount context (optional - for MetaMask reward discounts)
  setUserFeeDiscount?(discountBips: number | undefined): void;

  // HIP-3 (Builder-deployed DEXs) operations - optional for backward compatibility
  /**
   * Get list of available HIP-3 builder-deployed DEXs.
   *
   * @param params - Optional parameters (reserved for future filters/pagination)
   * @returns Array of DEX names (empty string '' represents main DEX)
   */
  getAvailableDexs?(params?: GetAvailableDexsParams): Promise<string[]>;
};

// ============================================================================
// Multi-Provider Aggregation Types (Phase 1)
// ============================================================================

/**
 * Provider identifier type for multi-provider support.
 * Add new providers here as they are implemented.
 */
export type PerpsProviderType = 'hyperliquid' | 'myx';

/**
 * Active provider mode for PerpsController state.
 * - Direct providers: 'hyperliquid', 'myx'
 * - 'aggregated': Multi-provider aggregation mode
 */
export type PerpsActiveProviderMode = PerpsProviderType | 'aggregated';

/**
 * Aggregation mode for read operations.
 * - 'all': Aggregate data from all registered providers
 * - 'active': Only aggregate from providers with active connections
 * - 'specific': Aggregate from a specific subset of providers
 */
export type AggregationMode = 'all' | 'active' | 'specific';

/**
 * Routing strategy for write operations.
 * Phase 1 only supports 'default_provider' - advanced strategies deferred to Phase 3.
 */
export type RoutingStrategy = 'default_provider';

/**
 * Rewards controller operations required by Perps (optional).
 * Provides fee discount capabilities for MetaMask rewards program.
 */
export type PerpsRewardsOperations = {
  /**
   * Get fee discount for an account.
   * Returns discount in basis points (e.g., 6500 = 65% discount)
   */
  getFeeDiscount(
    caipAccountId: `${string}:${string}:${string}`,
  ): Promise<number>;
};

/**
 * Authentication controller operations required by Perps (optional).
 * Provides bearer token access for authenticated API calls.
 */
export type PerpsAuthenticationOperations = {
  /**
   * Get a bearer token for authenticated API requests.
   */
  getBearerToken(): Promise<string>;
};

/**
 * Consolidated controller access interface.
 * Groups ALL controller dependencies in one place for clarity.
 *
 * Benefits:
 * 1. Clear separation: observability utilities vs controller access
 * 2. Consistent pattern: all controllers accessed via deps.controllers.*
 * 3. Mockable: test can mock entire controllers object
 * 4. Future-proof: add new controller access without bloating top-level
 */
export type PerpsControllerAccess = {
  /** Account utilities - wraps AccountsController access */
  accounts: PerpsAccountUtils;
  /** Keyring operations - wraps KeyringController for signing */
  keyring: PerpsKeyringController;
  /** Network operations - wraps NetworkController for chain lookups */
  network: PerpsNetworkOperations;
  /** Transaction operations - wraps TransactionController for TX submission */
  transaction: PerpsTransactionOperations;
  /** Rewards operations - wraps RewardsController for fee discounts */
  rewards: PerpsRewardsOperations;
  /** Authentication operations - wraps AuthenticationController for bearer tokens */
  authentication: PerpsAuthenticationOperations;
};

/**
 * Combined platform dependencies for PerpsController and services.
 * All platform-specific dependencies are bundled here for easy injection.
 *
 * Architecture:
 * - Observability: logger, debugLogger, metrics, performance, tracer (stateless utilities)
 * - Platform: streamManager (mobile/extension specific capabilities)
 * - Controllers: consolidated access to all external controllers
 *
 * This interface enables dependency injection for platform-specific services,
 * allowing PerpsController to be moved to core without mobile-specific imports.
 */
export type PerpsPlatformDependencies = {
  // === Observability (stateless utilities) ===
  logger: PerpsLogger;
  debugLogger: PerpsDebugLogger;
  metrics: PerpsMetrics;
  performance: PerpsPerformance;
  tracer: PerpsTracer;

  // === Platform Services (mobile/extension specific) ===
  streamManager: PerpsStreamManager;

  // === Controller Access (ALL controllers consolidated) ===
  controllers: PerpsControllerAccess;
};

/**
 * Configuration for AggregatedPerpsProvider
 */
export type AggregatedProviderConfig = {
  /** Map of provider ID to provider instance */
  providers: Map<PerpsProviderType, PerpsProvider>;
  /** Default provider for write operations when providerId not specified */
  defaultProvider: PerpsProviderType;
  /** Aggregation mode for read operations (default: 'all') */
  aggregationMode?: AggregationMode;
  /** Platform dependencies for logging, metrics, etc. */
  infrastructure: PerpsPlatformDependencies;
};

/**
 * Provider-specific error with context for multi-provider error handling
 */
export type ProviderError = {
  /** Which provider the error originated from */
  providerId: PerpsProviderType;
  /** Human-readable error message */
  message: string;
  /** Original error object if available */
  originalError?: Error;
  /** Whether the operation can be retried */
  isRetryable?: boolean;
};

/**
 * Aggregated account state combining data from multiple providers
 */
export type AggregatedAccountState = {
  /** Combined totals across all providers */
  total: AccountState;
  /** Per-provider breakdown */
  byProvider: Map<PerpsProviderType, AccountState>;
};

// ============================================================================
// Injectable Dependency Interfaces
// These interfaces enable dependency injection for platform-specific services,
// allowing PerpsController to be moved to core without mobile-specific imports.
// ============================================================================

/**
 * Injectable logger interface for error reporting.
 * Allows core package to be platform-agnostic (mobile: Sentry, extension: different impl)
 */
export type PerpsLogger = {
  error(
    error: Error,
    options?: {
      tags?: Record<string, string | number>;
      context?: { name: string; data: Record<string, unknown> };
      extras?: Record<string, unknown>;
    },
  ): void;
};

/**
 * Analytics events specific to Perps feature.
 * These are the actual event names sent to analytics backend.
 * Values must match the corresponding MetaMetricsEvents values in mobile for compatibility.
 *
 * When migrating to core monorepo, this enum travels with PerpsController.
 */
export enum PerpsAnalyticsEvent {
  WithdrawalTransaction = 'Perp Withdrawal Transaction',
  TradeTransaction = 'Perp Trade Transaction',
  PositionCloseTransaction = 'Perp Position Close Transaction',
  OrderCancelTransaction = 'Perp Order Cancel Transaction',
  ScreenViewed = 'Perp Screen Viewed',
  UiInteraction = 'Perp UI Interaction',
  RiskManagement = 'Perp Risk Management',
  PerpsError = 'Perp Error',
}

/**
 * Perps-specific trace names. These must match TraceName enum values in mobile.
 * When in core monorepo, this defines the valid trace names for Perps operations.
 */
export type PerpsTraceName =
  | 'Perps Open Position'
  | 'Perps Close Position'
  | 'Perps Deposit'
  | 'Perps Withdraw'
  | 'Perps Place Order'
  | 'Perps Edit Order'
  | 'Perps Cancel Order'
  | 'Perps Update TP/SL'
  | 'Perps Update Margin'
  | 'Perps Flip Position'
  | 'Perps Order Submission Toast'
  | 'Perps Market Data Update'
  | 'Perps Order View'
  | 'Perps Tab View'
  | 'Perps Market List View'
  | 'Perps Position Details View'
  | 'Perps Adjust Margin View'
  | 'Perps Order Details View'
  | 'Perps Order Book View'
  | 'Perps Flip Position Sheet'
  | 'Perps Transactions View'
  | 'Perps Order Fills Fetch'
  | 'Perps Orders Fetch'
  | 'Perps Funding Fetch'
  | 'Perps Get Positions'
  | 'Perps Get Account State'
  | 'Perps Get Historical Portfolio'
  | 'Perps Get Markets'
  | 'Perps Fetch Historical Candles'
  | 'Perps WebSocket Connected'
  | 'Perps WebSocket Disconnected'
  | 'Perps WebSocket First Positions'
  | 'Perps WebSocket First Orders'
  | 'Perps WebSocket First Account'
  | 'Perps Data Lake Report'
  | 'Perps Rewards API Call'
  | 'Perps Close Position View'
  | 'Perps Withdraw View'
  | 'Perps Connection Establishment'
  | 'Perps Account Switch Reconnection';

/**
 * Perps trace name constants. Values match TraceName enum in mobile.
 * When in core, these ARE the source of truth - mobile will re-export from core.
 */
export const PerpsTraceNames = {
  // Trading operations
  PlaceOrder: 'Perps Place Order',
  EditOrder: 'Perps Edit Order',
  CancelOrder: 'Perps Cancel Order',
  ClosePosition: 'Perps Close Position',
  UpdateTpsl: 'Perps Update TP/SL',
  UpdateMargin: 'Perps Update Margin',
  FlipPosition: 'Perps Flip Position',

  // Account operations
  Withdraw: 'Perps Withdraw',
  Deposit: 'Perps Deposit',

  // Market data
  GetPositions: 'Perps Get Positions',
  GetAccountState: 'Perps Get Account State',
  GetMarkets: 'Perps Get Markets',
  OrderFillsFetch: 'Perps Order Fills Fetch',
  OrdersFetch: 'Perps Orders Fetch',
  FundingFetch: 'Perps Funding Fetch',
  GetHistoricalPortfolio: 'Perps Get Historical Portfolio',
  FetchHistoricalCandles: 'Perps Fetch Historical Candles',

  // Data lake
  DataLakeReport: 'Perps Data Lake Report',

  // WebSocket
  WebsocketConnected: 'Perps WebSocket Connected',
  WebsocketDisconnected: 'Perps WebSocket Disconnected',
  WebsocketFirstPositions: 'Perps WebSocket First Positions',
  WebsocketFirstOrders: 'Perps WebSocket First Orders',
  WebsocketFirstAccount: 'Perps WebSocket First Account',

  // Other
  RewardsApiCall: 'Perps Rewards API Call',
  ConnectionEstablishment: 'Perps Connection Establishment',
  AccountSwitchReconnection: 'Perps Account Switch Reconnection',
} as const satisfies Record<string, PerpsTraceName>;

/**
 * Perps trace operation constants. Values match TraceOperation enum in mobile.
 * These categorize traces by type of operation for Sentry/observability filtering.
 */
export const PerpsTraceOperations = {
  Operation: 'perps.operation',
  OrderSubmission: 'perps.order_submission',
  PositionManagement: 'perps.position_management',
  MarketData: 'perps.market_data',
} as const;

/**
 * Values allowed in trace data/tags. Matches Sentry's TraceValue type.
 */
export type PerpsTraceValue = string | number | boolean;

/**
 * Properties allowed in analytics events. More constrained than unknown.
 * Named PerpsAnalyticsProperties to avoid conflict with PerpsEventProperties
 * constant object from eventNames.ts (which contains property key names).
 */
export type PerpsAnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Injectable metrics interface for analytics.
 * Allows core package to work with different analytics backends.
 */
export type PerpsMetrics = {
  isEnabled(): boolean;

  /**
   * Track a Perps-specific analytics event with properties.
   * This abstracts away the MetricsEventBuilder pattern used in mobile.
   *
   * @param event - The Perps analytics event type (enum with actual event name values)
   * @param properties - Type-safe key-value properties to attach to the event
   */
  trackPerpsEvent(
    event: PerpsAnalyticsEvent,
    properties: PerpsAnalyticsProperties,
  ): void;
};

/**
 * Injectable debug logger for development logging.
 * Only logs in development mode.
 * Accepts `unknown` to allow logging error objects from catch blocks.
 */
export type PerpsDebugLogger = {
  log(...args: unknown[]): void;
};

/**
 * Injectable stream manager interface for pause/resume during critical operations.
 *
 * WHY THIS IS NEEDED:
 * PerpsStreamManager is a React-based mobile-specific singleton that:
 * - Uses React Context for subscription management
 * - Uses react-native-performance for tracing
 * - Directly accesses Engine.context (mobile singleton pattern)
 * - Manages WebSocket connections with throttling/caching
 *
 * PerpsController only needs pause/resume during critical operations (withStreamPause method)
 * to prevent stale UI updates during batch operations. The minimal interface allows:
 * - Mobile: Wrap existing singleton (streamManager[channel].pause())
 * - Extension: Implement with whatever streaming solution they use
 */
export type PerpsStreamManager = {
  pauseChannel(channel: string): void;
  resumeChannel(channel: string): void;
  clearAllChannels(): void;
};

/**
 * Injectable performance monitor interface.
 * Wraps react-native-performance or browser Performance API.
 */
export type PerpsPerformance = {
  now(): number;
};

/**
 * Injectable tracer interface for Sentry/observability tracing.
 * Services use this to create spans and measure operation durations.
 *
 * Note: trace() returns void because services use name/id pairs to identify traces.
 * The actual span management is handled internally by the platform adapter.
 */
export type PerpsTracer = {
  trace(params: {
    name: PerpsTraceName;
    id: string;
    op: string;
    tags?: Record<string, PerpsTraceValue>;
    data?: Record<string, PerpsTraceValue>;
  }): void;

  endTrace(params: {
    name: PerpsTraceName;
    id: string;
    data?: Record<string, PerpsTraceValue>;
  }): void;

  setMeasurement(name: string, value: number, unit: string): void;
};

/**
 * Injectable keyring controller interface for signing operations.
 * Allows services to sign typed messages without directly accessing Engine.
 */
export type PerpsKeyringController = {
  signTypedMessage(
    msgParams: { from: string; data: unknown },
    version: string,
  ): Promise<string>;
};

/**
 * Injectable account utilities interface.
 * Provides access to selected account without coupling to Engine singleton.
 */
export type PerpsAccountUtils = {
  getSelectedEvmAccount(): { address: string } | undefined;
  formatAccountToCaipId(address: string, chainId: string): string | null;
};

// ============================================================================
// Controller Access Interfaces
// These granular interfaces define the specific operations needed from each
// controller, enabling cleaner dependency injection and easier testing.
// ============================================================================

/**
 * Network controller operations required by Perps.
 * Provides chain ID lookups and network client identification.
 */
export type PerpsNetworkOperations = {
  /**
   * Get the chain ID for a given network client.
   */
  getChainIdForNetwork(networkClientId: string): Hex;

  /**
   * Find the network client ID for a given chain.
   */
  findNetworkClientIdForChain(chainId: Hex): string | undefined;

  /**
   * Get the currently selected network client ID.
   */
  getSelectedNetworkClientId(): string;
};

/**
 * Transaction controller operations required by Perps.
 * Provides transaction submission capabilities.
 */
export type PerpsTransactionOperations = {
  /**
   * Submit a transaction to the blockchain.
   * Returns the result promise and transaction metadata.
   */
  submit(
    txParams: {
      from: string;
      to?: string;
      value?: string;
      data?: string;
    },
    options: {
      networkClientId: string;
      origin?: string;
      type?: string; // Will be bridged to TransactionType in adapter
      skipInitialGasEstimate?: boolean;
      gasFeeToken?: Hex;
    },
  ): Promise<{
    result: Promise<string>; // Resolves to txHash
    transactionMeta: { id: string; hash?: string };
  }>;
};

// Add other re-exports as needed when more imports from @metamask/perps-controller are required
