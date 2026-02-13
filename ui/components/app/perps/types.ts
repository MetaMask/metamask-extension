/* eslint-disable @typescript-eslint/consistent-type-definitions */
// ESLint override: BaseController requires 'type' for Json compatibility, not 'interface'

/**
 * Market data with prices for UI display
 * Protocol-agnostic interface for market information with formatted values
 */

import type {
  CaipAccountId,
  CaipChainId,
  CaipAssetId,
  Hex,
} from '@metamask/utils';

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
