/* eslint-disable @typescript-eslint/consistent-type-definitions */
// ESLint override: Using 'type' instead of 'interface' for BaseController Json compatibility

// Re-export chart types
export * from './chart';

// Re-export HyperLiquid SDK types
export * from './hyperliquid-types';

// Re-export transaction types
export * from './transactionTypes';

// Import chart types for local use
import type { CandleData } from './chart';
import type { CandlePeriod, TimeDuration } from './chart';

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
export type TrackingData = {
  totalFee: number;
  marketPrice: number;
  metamaskFee?: number;
  metamaskFeeRate?: number;
  feeDiscountPercentage?: number;
  estimatedPoints?: number;
  marginUsed?: number;
  inputMethod?: InputMethod;
  tradeAction?: TradeAction;
  receivedAmount?: number;
  realizedPnl?: number;
  source?: string;
};

// TP/SL-specific tracking data for analytics events
export type TPSLTrackingData = {
  direction: 'long' | 'short';
  source: string;
  positionSize: number;
  takeProfitPercentage?: number;
  stopLossPercentage?: number;
  isEditingExistingPosition?: boolean;
  entryPrice?: number;
};

// MetaMask Perps API order parameters for PerpsController
export type OrderParams = {
  symbol: string;
  isBuy: boolean;
  size: string;
  orderType: OrderType;
  price?: string;
  reduceOnly?: boolean;
  isFullClose?: boolean;
  timeInForce?: 'GTC' | 'IOC' | 'ALO';
  usdAmount?: string;
  priceAtCalculation?: number;
  maxSlippageBps?: number;
  takeProfitPrice?: string;
  stopLossPrice?: string;
  clientOrderId?: string;
  slippage?: number;
  grouping?: 'na' | 'normalTpsl' | 'positionTpsl';
  currentPrice?: number;
  leverage?: number;
  existingPositionLeverage?: number;
  trackingData?: TrackingData;
  providerId?: PerpsProviderType;
};

export type OrderResult = {
  success?: boolean;
  orderId?: string;
  error?: string;
  filledSize?: string;
  averagePrice?: string;
  providerId?: PerpsProviderType;
};

export type Position = {
  symbol: string;
  size: string;
  entryPrice: string;
  positionValue: string;
  unrealizedPnl: string;
  marginUsed: string;
  leverage: {
    type: 'isolated' | 'cross';
    value: number;
    rawUsd?: string;
  };
  liquidationPrice: string | null;
  maxLeverage: number;
  returnOnEquity: string;
  cumulativeFunding: {
    allTime: string;
    sinceOpen: string;
    sinceChange: string;
  };
  takeProfitPrice?: string;
  stopLossPrice?: string;
  takeProfitCount: number;
  stopLossCount: number;
  providerId?: PerpsProviderType;
};

export type AccountState = {
  availableBalance: string;
  totalBalance: string;
  marginUsed: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  subAccountBreakdown?: Record<
    string,
    {
      availableBalance: string;
      totalBalance: string;
    }
  >;
  providerId?: PerpsProviderType;
};

export type ClosePositionParams = {
  symbol: string;
  size?: string;
  orderType?: OrderType;
  price?: string;
  currentPrice?: number;
  usdAmount?: string;
  priceAtCalculation?: number;
  maxSlippageBps?: number;
  trackingData?: TrackingData;
  providerId?: PerpsProviderType;
};

export type ClosePositionsParams = {
  symbols?: string[];
  closeAll?: boolean;
};

export type ClosePositionsResult = {
  success: boolean;
  successCount: number;
  failureCount: number;
  results: {
    symbol: string;
    success: boolean;
    error?: string;
  }[];
};

export type UpdateMarginParams = {
  symbol: string;
  amount: string;
  providerId?: PerpsProviderType;
};

export type MarginResult = {
  success: boolean;
  error?: string;
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
  name: string;
  szDecimals: number;
  maxLeverage: number;
  marginTableId: number;
  onlyIsolated?: true;
  isDelisted?: true;
  minimumOrderSize?: number;
  providerId?: PerpsProviderType;
};

export type PerpsMarketData = {
  symbol: string;
  name: string;
  maxLeverage: string;
  price: string;
  change24h: string;
  change24hPercent: string;
  volume: string;
  openInterest?: string;
  nextFundingTime?: number;
  fundingIntervalHours?: number;
  fundingRate?: number;
  marketSource?: string | null;
  marketType?: MarketType;
  providerId?: PerpsProviderType;
};

export type ToggleTestnetResult = {
  success: boolean;
  isTestnet: boolean;
  error?: string;
};

export type CancelOrderParams = {
  orderId: string;
  symbol: string;
  providerId?: PerpsProviderType;
};

export type CancelOrderResult = {
  success: boolean;
  orderId?: string;
  error?: string;
  providerId?: PerpsProviderType;
};

export type BatchCancelOrdersParams = {
  orderId: string;
  symbol: string;
}[];

export type CancelOrdersParams = {
  symbols?: string[];
  orderIds?: string[];
  cancelAll?: boolean;
};

export type CancelOrdersResult = {
  success: boolean;
  successCount: number;
  failureCount: number;
  results: {
    orderId: string;
    symbol: string;
    success: boolean;
    error?: string;
  }[];
};

export type EditOrderParams = {
  orderId: string | number;
  newOrder: OrderParams;
};

export type WithdrawParams = {
  amount: string;
  destination?: string;
  assetId?: string;
  providerId?: PerpsProviderType;
};

export type WithdrawResult = {
  success: boolean;
  txHash?: string;
  error?: string;
  withdrawalId?: string;
  estimatedArrivalTime?: number;
};

export type GetHistoricalPortfolioParams = {
  accountId?: string;
};

export type HistoricalPortfolioResult = {
  accountValue1dAgo: string;
  timestamp: number;
};

export type PriceUpdate = {
  symbol: string;
  price: string;
  timestamp: number;
  percentChange24h?: string;
  bestBid?: string;
  bestAsk?: string;
  spread?: string;
  markPrice?: string;
  funding?: number;
  openInterest?: number;
  volume24h?: number;
  providerId?: PerpsProviderType;
};

export type OrderFill = {
  orderId: string;
  symbol: string;
  side: string;
  size: string;
  price: string;
  pnl: string;
  direction: string;
  fee: string;
  feeToken: string;
  timestamp: number;
  startPosition?: string;
  success?: boolean;
  liquidation?: {
    liquidatedUser: string;
    markPx: string;
    method: string;
  };
  orderType?: 'take_profit' | 'stop_loss' | 'liquidation' | 'regular';
  detailedOrderType?: string;
  providerId?: PerpsProviderType;
};

export type GetPositionsParams = {
  accountId?: string;
  includeHistory?: boolean;
  skipCache?: boolean;
};

export type GetAccountStateParams = {
  accountId?: string;
  source?: string;
};

export type GetOrderFillsParams = {
  accountId?: string;
  user?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  aggregateByTime?: boolean;
};

export type GetOrdersParams = {
  accountId?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
};

export type GetFundingParams = {
  accountId?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
};

export type GetMarketsParams = {
  symbols?: string[];
  dex?: string;
  skipFilters?: boolean;
  readOnly?: boolean;
};

export type SubscribePricesParams = {
  symbols: string[];
  callback: (prices: PriceUpdate[]) => void;
  throttleMs?: number;
  includeOrderBook?: boolean;
  includeMarketData?: boolean;
};

export type SubscribePositionsParams = {
  callback: (positions: Position[]) => void;
  accountId?: string;
  includeHistory?: boolean;
};

export type SubscribeOrderFillsParams = {
  callback: (fills: OrderFill[], isSnapshot?: boolean) => void;
  accountId?: string;
  since?: number;
};

export type SubscribeOrdersParams = {
  callback: (orders: Order[]) => void;
  accountId?: string;
  includeHistory?: boolean;
};

export type SubscribeAccountParams = {
  callback: (account: AccountState) => void;
  accountId?: string;
};

export type SubscribeOICapsParams = {
  callback: (caps: string[]) => void;
  accountId?: string;
};

export type SubscribeCandlesParams = {
  symbol: string;
  interval: CandlePeriod;
  duration?: TimeDuration;
  callback: (data: CandleData) => void;
  onError?: (error: Error) => void;
};

export type OrderBookLevel = {
  price: string;
  size: string;
  total: string;
  notional: string;
  totalNotional: string;
};

export type OrderBookData = {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: string;
  spreadPercentage: string;
  midPrice: string;
  lastUpdated: number;
  maxTotal: string;
};

export type SubscribeOrderBookParams = {
  symbol: string;
  levels?: number;
  nSigFigs?: 2 | 3 | 4 | 5;
  mantissa?: 2 | 5;
  callback: (orderBook: OrderBookData) => void;
  onError?: (error: Error) => void;
};

export type LiquidationPriceParams = {
  entryPrice: number;
  leverage: number;
  direction: 'long' | 'short';
  positionSize?: number;
  marginType?: 'isolated' | 'cross';
  asset?: string;
};

export type MaintenanceMarginParams = {
  asset: string;
  positionSize?: number;
};

export type FeeCalculationParams = {
  orderType: 'market' | 'limit';
  isMaker?: boolean;
  amount?: string;
  symbol: string;
};

export type FeeCalculationResult = {
  feeRate?: number;
  feeAmount?: number;
  protocolFeeRate?: number;
  protocolFeeAmount?: number;
  metamaskFeeRate?: number;
  metamaskFeeAmount?: number;
  breakdown?: {
    baseFeeRate: number;
    volumeTier?: string;
    volumeDiscount?: number;
    stakingDiscount?: number;
  };
};

export type UpdatePositionTPSLParams = {
  symbol: string;
  takeProfitPrice?: string;
  stopLossPrice?: string;
  trackingData?: TPSLTrackingData;
  providerId?: PerpsProviderType;
};

export type Order = {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  orderType: OrderType;
  size: string;
  originalSize: string;
  price: string;
  filledSize: string;
  remainingSize: string;
  status: 'open' | 'filled' | 'canceled' | 'rejected' | 'triggered' | 'queued';
  timestamp: number;
  lastUpdated?: number;
  takeProfitPrice?: string;
  stopLossPrice?: string;
  stopLossOrderId?: string;
  takeProfitOrderId?: string;
  detailedOrderType?: string;
  isTrigger?: boolean;
  reduceOnly?: boolean;
  triggerPrice?: string;
  providerId?: PerpsProviderType;
};

export type Funding = {
  symbol: string;
  amountUsd: string;
  rate: string;
  timestamp: number;
  transactionHash?: string;
};

export type SwitchProviderResult = {
  success: boolean;
  providerId: PerpsActiveProviderMode;
  error?: string;
};

// Multi-Provider Aggregation Types
export type PerpsProviderType = 'hyperliquid' | 'myx';
export type PerpsActiveProviderMode = PerpsProviderType | 'aggregated';
export type AggregationMode = 'all' | 'active' | 'specific';
export type RoutingStrategy = 'default_provider';

// Analytics Events
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

// Perps Trace Names
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

export const PerpsTraceNames = {
  PlaceOrder: 'Perps Place Order',
  EditOrder: 'Perps Edit Order',
  CancelOrder: 'Perps Cancel Order',
  ClosePosition: 'Perps Close Position',
  UpdateTpsl: 'Perps Update TP/SL',
  UpdateMargin: 'Perps Update Margin',
  FlipPosition: 'Perps Flip Position',
  Withdraw: 'Perps Withdraw',
  Deposit: 'Perps Deposit',
  GetPositions: 'Perps Get Positions',
  GetAccountState: 'Perps Get Account State',
  GetMarkets: 'Perps Get Markets',
  OrderFillsFetch: 'Perps Order Fills Fetch',
  OrdersFetch: 'Perps Orders Fetch',
  FundingFetch: 'Perps Funding Fetch',
  GetHistoricalPortfolio: 'Perps Get Historical Portfolio',
  FetchHistoricalCandles: 'Perps Fetch Historical Candles',
  DataLakeReport: 'Perps Data Lake Report',
  WebsocketConnected: 'Perps WebSocket Connected',
  WebsocketDisconnected: 'Perps WebSocket Disconnected',
  WebsocketFirstPositions: 'Perps WebSocket First Positions',
  WebsocketFirstOrders: 'Perps WebSocket First Orders',
  WebsocketFirstAccount: 'Perps WebSocket First Account',
  RewardsApiCall: 'Perps Rewards API Call',
  ConnectionEstablishment: 'Perps Connection Establishment',
  AccountSwitchReconnection: 'Perps Account Switch Reconnection',
} as const satisfies Record<string, PerpsTraceName>;

export const PerpsTraceOperations = {
  Operation: 'perps.operation',
  OrderSubmission: 'perps.order_submission',
  PositionManagement: 'perps.position_management',
  MarketData: 'perps.market_data',
} as const;

export type PerpsTraceValue = string | number | boolean;
export type PerpsAnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

// Injectable dependency interfaces (simplified for mock)
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

export type PerpsMetrics = {
  isEnabled(): boolean;
  trackPerpsEvent(
    event: PerpsAnalyticsEvent,
    properties: PerpsAnalyticsProperties,
  ): void;
};

export type PerpsDebugLogger = {
  log(...args: unknown[]): void;
};

export type PerpsStreamManager = {
  pauseChannel(channel: string): void;
  resumeChannel(channel: string): void;
  clearAllChannels(): void;
};

export type PerpsPerformance = {
  now(): number;
};

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

export type PerpsKeyringController = {
  signTypedMessage(
    msgParams: { from: string; data: unknown },
    version: string,
  ): Promise<string>;
};

export type PerpsAccountUtils = {
  getSelectedEvmAccount(): { address: string } | undefined;
  formatAccountToCaipId(address: string, chainId: string): string | null;
};

export type PerpsNetworkOperations = {
  getChainIdForNetwork(networkClientId: string): string;
  findNetworkClientIdForChain(chainId: string): string | undefined;
  getSelectedNetworkClientId(): string;
};

export type PerpsTransactionOperations = {
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
      type?: string;
      skipInitialGasEstimate?: boolean;
      gasFeeToken?: string;
    },
  ): Promise<{
    result: Promise<string>;
    transactionMeta: { id: string; hash?: string };
  }>;
};

export type PerpsRewardsOperations = {
  getFeeDiscount(caipAccountId: string): Promise<number>;
};

export type PerpsAuthenticationOperations = {
  getBearerToken(): Promise<string>;
};

export type PerpsControllerAccess = {
  accounts: PerpsAccountUtils;
  keyring: PerpsKeyringController;
  network: PerpsNetworkOperations;
  transaction: PerpsTransactionOperations;
  rewards: PerpsRewardsOperations;
  authentication: PerpsAuthenticationOperations;
};

export type PerpsPlatformDependencies = {
  logger: PerpsLogger;
  debugLogger: PerpsDebugLogger;
  metrics: PerpsMetrics;
  performance: PerpsPerformance;
  tracer: PerpsTracer;
  streamManager: PerpsStreamManager;
  controllers: PerpsControllerAccess;
};

export type PerpsControllerConfig = {
  fallbackBlockedRegions?: string[];
  fallbackHip3Enabled?: boolean;
  fallbackHip3AllowlistMarkets?: string[];
  fallbackHip3BlocklistMarkets?: string[];
};

export type LiveDataConfig = {
  priceThrottleMs?: number;
  positionThrottleMs?: number;
  maxUpdatesPerSecond?: number;
};

// Trade configuration saved per market per network
export type TradeConfiguration = {
  leverage?: number;
  pendingConfig?: {
    amount?: string;
    leverage?: number;
    takeProfitPrice?: string;
    stopLossPrice?: string;
    limitPrice?: string;
    orderType?: OrderType;
    timestamp: number;
  };
};
