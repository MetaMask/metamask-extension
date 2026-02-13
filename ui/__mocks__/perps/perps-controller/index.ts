/**
 * Mock package for @metamask/perps-controller
 *
 * This file acts as a local replacement for the @metamask/perps-controller package
 * during development. It re-exports constants and types from local mock files.
 *
 * When the actual perps-controller is integrated, simply remove this mock folder
 * and update the webpack/TypeScript aliases.
 */

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

// Add other re-exports as needed when more imports from @metamask/perps-controller are required
