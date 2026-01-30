import type {
  AccountState,
  CancelOrderParams,
  CancelOrderResult,
  CancelOrdersParams,
  CancelOrdersResult,
  ClosePositionParams,
  ClosePositionsParams,
  ClosePositionsResult,
  DisconnectResult,
  EditOrderParams,
  FeeCalculationParams,
  FeeCalculationResult,
  Funding,
  GetAccountStateParams,
  GetFundingParams,
  GetHistoricalPortfolioParams,
  GetMarketsParams,
  GetOrderFillsParams,
  GetOrdersParams,
  GetPositionsParams,
  HistoricalPortfolioResult,
  InitializeResult,
  LiquidationPriceParams,
  LiveDataConfig,
  MaintenanceMarginParams,
  MarginResult,
  MarketInfo,
  Order,
  OrderFill,
  OrderParams,
  OrderResult,
  PerpsControllerConfig,
  PerpsMarketData,
  Position,
  PriceUpdate,
  ReadyToTradeResult,
  SubscribeAccountParams,
  SubscribeCandlesParams,
  SubscribeOICapsParams,
  SubscribeOrderBookParams,
  SubscribeOrderFillsParams,
  SubscribeOrdersParams,
  SubscribePositionsParams,
  SubscribePricesParams,
  ToggleTestnetResult,
  TradeConfiguration,
  UpdateMarginParams,
  UpdatePositionTPSLParams,
  WebSocketConnectionState,
  WithdrawParams,
  WithdrawResult,
} from './types';

import {
  MOCK_ACCOUNT,
  MOCK_MARKETS,
  MOCK_MARKET_DATA,
  MOCK_POSITIONS,
  MOCK_ORDERS,
  MOCK_ORDER_FILLS,
  MOCK_FUNDING,
} from './mocks';

/**
 * PerpsControllerState type for controller state management
 */
export type PerpsControllerState = {
  activeProvider: 'hyperliquid';
  isTestnet: boolean;
  initializationState:
    | 'uninitialized'
    | 'initializing'
    | 'initialized'
    | 'failed';
  isEligible: boolean;
  accountState: AccountState | null;
  watchlistMarkets: { testnet: string[]; mainnet: string[] };
  tradeConfigurations: {
    testnet: Record<string, TradeConfiguration>;
    mainnet: Record<string, TradeConfiguration>;
  };
};

/**
 * Returns the default PerpsController state
 * Following the pattern of returning a new object each time to avoid mutation risks
 */
export function getDefaultPerpsControllerState(): PerpsControllerState {
  return {
    activeProvider: 'hyperliquid',
    isTestnet: false,
    initializationState: 'initialized',
    isEligible: true,
    accountState: null,
    watchlistMarkets: { testnet: [], mainnet: [] },
    tradeConfigurations: { testnet: {}, mainnet: {} },
  };
}

/**
 * MockPerpsController - A stub implementation for UI development
 *
 * This mock controller provides the same API surface as the real PerpsController
 * but returns mock data instead of connecting to real trading infrastructure.
 *
 * Purpose:
 * - Enable frontend development before the real @metamask/perps-controller is integrated
 * - Provide consistent mock data for UI testing and Storybook
 * - Serve as API documentation for the real controller interface
 *
 * Usage:
 * ```typescript
 * import { MockPerpsController } from '../controllers/perps';
 *
 * const controller = new MockPerpsController();
 * await controller.init();
 * const positions = await controller.getPositions();
 * ```
 *
 * When the real PerpsController is ready, update the barrel export:
 * ```typescript
 * export { PerpsController } from '@metamask/perps-controller';
 * ```
 */
export class MockPerpsController {
  /**
   * Controller state - publicly accessible for Redux integration
   */
  state: PerpsControllerState;

  /**
   * Optional configuration passed during construction
   */
  readonly #config?: PerpsControllerConfig;

  /**
   * Creates a new MockPerpsController instance
   *
   * @param options - Optional configuration object
   * @param options.config - Controller configuration for feature flags
   * @param options.state - Initial state override
   */
  constructor(options?: {
    config?: PerpsControllerConfig;
    state?: Partial<PerpsControllerState>;
  }) {
    this.#config = options?.config;
    this.state = {
      ...getDefaultPerpsControllerState(),
      ...options?.state,
    };
  }

  // ============================================================================
  // Initialization & Connection Management
  // ============================================================================

  /**
   * Initialize the controller and establish connections
   */
  async init(): Promise<void> {
    this.state.initializationState = 'initialized';
    this.state.accountState = MOCK_ACCOUNT;
  }

  /**
   * Initialize the perps provider
   */
  async initialize(): Promise<InitializeResult> {
    this.state.initializationState = 'initialized';
    this.state.accountState = MOCK_ACCOUNT;
    return { success: true, chainId: '42161' };
  }

  /**
   * Check if the controller is ready to trade
   */
  async isReadyToTrade(): Promise<ReadyToTradeResult> {
    return {
      ready: this.state.initializationState === 'initialized',
      walletConnected: true,
      networkSupported: true,
    };
  }

  /**
   * Disconnect from the perps provider
   */
  async disconnect(): Promise<DisconnectResult> {
    this.state.initializationState = 'uninitialized';
    this.state.accountState = null;
    return { success: true };
  }

  /**
   * Toggle between mainnet and testnet
   */
  async toggleTestnet(): Promise<ToggleTestnetResult> {
    this.state.isTestnet = !this.state.isTestnet;
    return { success: true, isTestnet: this.state.isTestnet };
  }

  /**
   * Get the current network mode
   */
  getCurrentNetwork(): 'mainnet' | 'testnet' {
    return this.state.isTestnet ? 'testnet' : 'mainnet';
  }

  /**
   * Ping the provider for health check
   */
  async ping(_timeoutMs?: number): Promise<void> {
    // Mock always succeeds
    return Promise.resolve();
  }

  /**
   * Get WebSocket connection state
   */
  getWebSocketConnectionState(): WebSocketConnectionState {
    return this.state.initializationState === 'initialized'
      ? WebSocketConnectionState.Connected
      : WebSocketConnectionState.Disconnected;
  }

  // ============================================================================
  // Data Fetching - Account & Positions
  // ============================================================================

  /**
   * Get current account state with balances and margin info
   */
  async getAccountState(_params?: GetAccountStateParams): Promise<AccountState> {
    return this.state.accountState ?? MOCK_ACCOUNT;
  }

  /**
   * Get current open positions
   */
  async getPositions(_params?: GetPositionsParams): Promise<Position[]> {
    return MOCK_POSITIONS;
  }

  /**
   * Get historical portfolio data for PnL calculations
   */
  async getHistoricalPortfolio(
    _params?: GetHistoricalPortfolioParams,
  ): Promise<HistoricalPortfolioResult> {
    return {
      accountValue1dAgo: '12150.00',
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
    };
  }

  // ============================================================================
  // Data Fetching - Markets
  // ============================================================================

  /**
   * Get available markets metadata
   */
  async getMarkets(_params?: GetMarketsParams): Promise<MarketInfo[]> {
    return MOCK_MARKETS;
  }

  /**
   * Get market data with prices for UI display
   */
  async getMarketDataWithPrices(): Promise<PerpsMarketData[]> {
    return MOCK_MARKET_DATA;
  }

  // ============================================================================
  // Data Fetching - Orders & History
  // ============================================================================

  /**
   * Get all orders (including historical)
   */
  async getOrders(_params?: GetOrdersParams): Promise<Order[]> {
    return MOCK_ORDERS;
  }

  /**
   * Get currently open orders only
   */
  async getOpenOrders(_params?: GetOrdersParams): Promise<Order[]> {
    return MOCK_ORDERS.filter((o) => o.status === 'open');
  }

  /**
   * Get order fill history
   */
  async getOrderFills(_params?: GetOrderFillsParams): Promise<OrderFill[]> {
    return MOCK_ORDER_FILLS;
  }

  /**
   * Get funding payment history
   */
  async getFunding(_params?: GetFundingParams): Promise<Funding[]> {
    return MOCK_FUNDING;
  }

  // ============================================================================
  // Trading Operations
  // ============================================================================

  /**
   * Place a new order
   */
  async placeOrder(_params: OrderParams): Promise<OrderResult> {
    return {
      success: true,
      orderId: `mock-order-${Date.now()}`,
      providerId: 'hyperliquid',
    };
  }

  /**
   * Edit an existing order
   */
  async editOrder(_params: EditOrderParams): Promise<OrderResult> {
    return {
      success: true,
      orderId: String(_params.orderId),
      providerId: 'hyperliquid',
    };
  }

  /**
   * Cancel a single order
   */
  async cancelOrder(_params: CancelOrderParams): Promise<CancelOrderResult> {
    return {
      success: true,
      orderId: _params.orderId,
      providerId: 'hyperliquid',
    };
  }

  /**
   * Cancel multiple orders
   */
  async cancelOrders(_params: CancelOrdersParams): Promise<CancelOrdersResult> {
    const orderIds = _params.orderIds ?? [];
    return {
      success: true,
      successCount: orderIds.length,
      failureCount: 0,
      results: orderIds.map((orderId) => ({
        orderId,
        symbol: 'BTC',
        success: true,
      })),
    };
  }

  /**
   * Close a single position
   */
  async closePosition(_params: ClosePositionParams): Promise<OrderResult> {
    return {
      success: true,
      orderId: `mock-close-${Date.now()}`,
      providerId: 'hyperliquid',
    };
  }

  /**
   * Close multiple positions
   */
  async closePositions(
    _params: ClosePositionsParams,
  ): Promise<ClosePositionsResult> {
    const symbols = _params.symbols ?? ['BTC', 'ETH'];
    return {
      success: true,
      successCount: symbols.length,
      failureCount: 0,
      results: symbols.map((symbol) => ({ symbol, success: true })),
    };
  }

  /**
   * Update position take-profit and stop-loss levels
   */
  async updatePositionTPSL(
    _params: UpdatePositionTPSLParams,
  ): Promise<OrderResult> {
    return {
      success: true,
      orderId: `mock-tpsl-${Date.now()}`,
      providerId: 'hyperliquid',
    };
  }

  /**
   * Update position margin (add or remove)
   */
  async updateMargin(_params: UpdateMarginParams): Promise<MarginResult> {
    return { success: true };
  }

  /**
   * Withdraw funds from perps account
   */
  async withdraw(_params: WithdrawParams): Promise<WithdrawResult> {
    return {
      success: true,
      txHash: `0xmock${Date.now().toString(16)}`,
      withdrawalId: `withdrawal-${Date.now()}`,
      estimatedArrivalTime: Date.now() + 5 * 60 * 1000, // 5 minutes
    };
  }

  // ============================================================================
  // Subscriptions (Real-time Data)
  // ============================================================================

  /**
   * Subscribe to price updates for specified symbols
   * @returns Unsubscribe function
   */
  subscribeToPrices(params: SubscribePricesParams): () => void {
    // Immediately call with mock data
    const mockPrices: PriceUpdate[] = params.symbols.map((symbol) => ({
      symbol,
      price: this.#getMockPrice(symbol),
      timestamp: Date.now(),
      percentChange24h: '+2.5%',
      providerId: 'hyperliquid',
    }));
    params.callback(mockPrices);

    // Return no-op unsubscribe
    return () => {};
  }

  /**
   * Subscribe to position updates
   * @returns Unsubscribe function
   */
  subscribeToPositions(params: SubscribePositionsParams): () => void {
    params.callback(MOCK_POSITIONS);
    return () => {};
  }

  /**
   * Subscribe to order updates
   * @returns Unsubscribe function
   */
  subscribeToOrders(params: SubscribeOrdersParams): () => void {
    params.callback(MOCK_ORDERS);
    return () => {};
  }

  /**
   * Subscribe to order fill updates
   * @returns Unsubscribe function
   */
  subscribeToOrderFills(params: SubscribeOrderFillsParams): () => void {
    params.callback(MOCK_ORDER_FILLS, true);
    return () => {};
  }

  /**
   * Subscribe to account state updates
   * @returns Unsubscribe function
   */
  subscribeToAccount(params: SubscribeAccountParams): () => void {
    params.callback(this.state.accountState ?? MOCK_ACCOUNT);
    return () => {};
  }

  /**
   * Subscribe to open interest cap updates
   * @returns Unsubscribe function
   */
  subscribeToOICaps(params: SubscribeOICapsParams): () => void {
    params.callback(['100000000', '50000000', '25000000']);
    return () => {};
  }

  /**
   * Subscribe to candlestick data
   * @returns Unsubscribe function
   */
  subscribeToCandles(params: SubscribeCandlesParams): () => void {
    // Provide mock candle data
    params.callback({
      symbol: params.symbol,
      interval: params.interval,
      candles: [
        {
          time: Date.now() - 60000,
          open: '65000',
          high: '65500',
          low: '64800',
          close: '65200',
          volume: '1250000',
        },
        {
          time: Date.now(),
          open: '65200',
          high: '65800',
          low: '65100',
          close: '65500',
          volume: '1180000',
        },
      ],
    });
    return () => {};
  }

  /**
   * Subscribe to order book updates
   * @returns Unsubscribe function
   */
  subscribeToOrderBook(params: SubscribeOrderBookParams): () => void {
    params.callback({
      bids: [
        {
          price: '65100',
          size: '0.5',
          total: '0.5',
          notional: '32550',
          totalNotional: '32550',
        },
        {
          price: '65050',
          size: '0.8',
          total: '1.3',
          notional: '52040',
          totalNotional: '84590',
        },
      ],
      asks: [
        {
          price: '65150',
          size: '0.4',
          total: '0.4',
          notional: '26060',
          totalNotional: '26060',
        },
        {
          price: '65200',
          size: '0.6',
          total: '1.0',
          notional: '39120',
          totalNotional: '65180',
        },
      ],
      spread: '50',
      spreadPercentage: '0.077',
      midPrice: '65125',
      lastUpdated: Date.now(),
      maxTotal: '1.3',
    });
    return () => {};
  }

  /**
   * Subscribe to WebSocket connection state changes
   * @returns Unsubscribe function
   */
  subscribeToConnectionState(
    _listener: (
      state: WebSocketConnectionState,
      reconnectionAttempt: number,
    ) => void,
  ): () => void {
    return () => {};
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Set live data configuration (throttling, etc.)
   */
  setLiveDataConfig(_config: Partial<LiveDataConfig>): void {
    // Mock implementation - no-op
  }

  // ============================================================================
  // Calculations
  // ============================================================================

  /**
   * Calculate liquidation price for a position
   */
  async calculateLiquidationPrice(
    params: LiquidationPriceParams,
  ): Promise<string> {
    const { entryPrice, leverage, direction } = params;
    // Simplified calculation for mock
    const liquidationDistance = entryPrice / leverage;
    const liquidationPrice =
      direction === 'long'
        ? entryPrice - liquidationDistance * 0.9
        : entryPrice + liquidationDistance * 0.9;
    return liquidationPrice.toFixed(2);
  }

  /**
   * Calculate maintenance margin for an asset
   */
  async calculateMaintenanceMargin(
    _params: MaintenanceMarginParams,
  ): Promise<number> {
    // Most assets have ~1% maintenance margin
    return 0.01;
  }

  /**
   * Get maximum leverage for an asset
   */
  async getMaxLeverage(asset: string): Promise<number> {
    const market = MOCK_MARKETS.find((m) => m.name === asset);
    return market?.maxLeverage ?? 20;
  }

  /**
   * Calculate trading fees
   */
  async calculateFees(params: FeeCalculationParams): Promise<FeeCalculationResult> {
    const baseFeeRate = params.orderType === 'market' ? 0.00045 : 0.00015;
    const metamaskFeeRate = 0.001;
    const totalFeeRate = baseFeeRate + metamaskFeeRate;

    const amount = params.amount ? parseFloat(params.amount) : undefined;
    const feeAmount = amount ? amount * totalFeeRate : undefined;
    const protocolFeeAmount = amount ? amount * baseFeeRate : undefined;
    const metamaskFeeAmount = amount ? amount * metamaskFeeRate : undefined;

    return {
      feeRate: totalFeeRate,
      feeAmount,
      protocolFeeRate: baseFeeRate,
      protocolFeeAmount,
      metamaskFeeRate,
      metamaskFeeAmount,
      breakdown: {
        baseFeeRate,
        volumeTier: 'Tier 0',
      },
    };
  }

  // ============================================================================
  // Watchlist Management
  // ============================================================================

  /**
   * Add a market to the watchlist
   */
  addToWatchlist(symbol: string): void {
    const network = this.getCurrentNetwork();
    if (!this.state.watchlistMarkets[network].includes(symbol)) {
      this.state.watchlistMarkets[network].push(symbol);
    }
  }

  /**
   * Remove a market from the watchlist
   */
  removeFromWatchlist(symbol: string): void {
    const network = this.getCurrentNetwork();
    this.state.watchlistMarkets[network] = this.state.watchlistMarkets[
      network
    ].filter((s) => s !== symbol);
  }

  /**
   * Get current watchlist
   */
  getWatchlist(): string[] {
    const network = this.getCurrentNetwork();
    return this.state.watchlistMarkets[network];
  }

  // ============================================================================
  // Trade Configuration Management
  // ============================================================================

  /**
   * Get trade configuration for a market
   */
  getTradeConfiguration(symbol: string): TradeConfiguration | undefined {
    const network = this.getCurrentNetwork();
    return this.state.tradeConfigurations[network][symbol];
  }

  /**
   * Set trade configuration for a market
   */
  setTradeConfiguration(
    symbol: string,
    config: Partial<TradeConfiguration>,
  ): void {
    const network = this.getCurrentNetwork();
    this.state.tradeConfigurations[network][symbol] = {
      ...this.state.tradeConfigurations[network][symbol],
      ...config,
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Get mock price for a symbol
   */
  #getMockPrice(symbol: string): string {
    const market = MOCK_MARKET_DATA.find(
      (m) => m.symbol === symbol || m.symbol.endsWith(`:${symbol}`),
    );
    return market?.price ?? '$100.00';
  }
}
