/* eslint-disable @typescript-eslint/consistent-type-definitions */
// ESLint override: BaseController requires 'type' for Json compatibility, not 'interface'

// Order type enumeration
export type OrderType = 'market' | 'limit';

// Market asset type classification (reusable across components)
export type MarketType = 'crypto' | 'equity' | 'commodity' | 'forex';

export type Position = {
  coin: string; // Asset symbol (e.g., 'ETH', 'BTC')
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
};

/**
 * Market data with prices for UI display
 * Protocol-agnostic interface for market information with formatted values
 */
export interface PerpsMarketData {
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
}

export interface Order {
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
}

/**
 * Account state for perps trading
 * Contains balance and P&L information
 */
export type AccountState = {
  totalBalance: string; // Total account value in USD
  availableBalance: string; // Available balance for new positions
  marginUsed: string; // Margin currently used by positions
  unrealizedPnl: string; // Unrealized profit/loss across all positions
  returnOnEquity: string; // Return on equity percentage
};
