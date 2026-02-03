import type { Order, OrderFill, Funding } from '@metamask/perps-controller';

/**
 * Mock open orders for development and testing
 */
export const MOCK_ORDERS: Order[] = [
  {
    orderId: 'order-001',
    symbol: 'BTC',
    side: 'buy',
    orderType: 'limit',
    size: '0.1',
    originalSize: '0.1',
    price: '92000',
    filledSize: '0',
    remainingSize: '0.1',
    status: 'open',
    timestamp: Date.now() - 3600000, // 1 hour ago
    lastUpdated: Date.now() - 3600000,
    reduceOnly: false,
    providerId: 'hyperliquid',
  },
  {
    orderId: 'order-002',
    symbol: 'ETH',
    side: 'sell',
    orderType: 'limit',
    size: '2',
    originalSize: '2',
    price: '3600',
    filledSize: '0',
    remainingSize: '2',
    status: 'open',
    timestamp: Date.now() - 7200000, // 2 hours ago
    lastUpdated: Date.now() - 7200000,
    reduceOnly: false,
    providerId: 'hyperliquid',
  },
  {
    orderId: 'order-003',
    symbol: 'SOL',
    side: 'buy',
    orderType: 'limit',
    size: '50',
    originalSize: '50',
    price: '175',
    filledSize: '0',
    remainingSize: '50',
    status: 'open',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    lastUpdated: Date.now() - 1800000,
    reduceOnly: false,
    providerId: 'hyperliquid',
  },
  {
    orderId: 'tp-001',
    symbol: 'BTC',
    side: 'sell',
    orderType: 'limit',
    size: '0.15',
    originalSize: '0.15',
    price: '75000',
    filledSize: '0',
    remainingSize: '0.15',
    status: 'open',
    timestamp: Date.now() - 86400000, // 1 day ago
    lastUpdated: Date.now() - 86400000,
    detailedOrderType: 'Take Profit Limit',
    isTrigger: true,
    triggerPrice: '75000',
    reduceOnly: true,
    providerId: 'hyperliquid',
  },
  {
    orderId: 'sl-001',
    symbol: 'BTC',
    side: 'sell',
    orderType: 'limit',
    size: '0.15',
    originalSize: '0.15',
    price: '58000',
    filledSize: '0',
    remainingSize: '0.15',
    status: 'open',
    timestamp: Date.now() - 86400000, // 1 day ago
    lastUpdated: Date.now() - 86400000,
    detailedOrderType: 'Stop Market',
    isTrigger: true,
    triggerPrice: '58000',
    reduceOnly: true,
    providerId: 'hyperliquid',
  },
];

/**
 * Mock filled orders (historical)
 */
export const MOCK_FILLED_ORDERS: Order[] = [
  {
    orderId: 'filled-001',
    symbol: 'BTC',
    side: 'buy',
    orderType: 'market',
    size: '0.15',
    originalSize: '0.15',
    price: '65000',
    filledSize: '0.15',
    remainingSize: '0',
    status: 'filled',
    timestamp: Date.now() - 172800000, // 2 days ago
    lastUpdated: Date.now() - 172800000,
    providerId: 'hyperliquid',
  },
  {
    orderId: 'filled-002',
    symbol: 'ETH',
    side: 'sell',
    orderType: 'market',
    size: '2.5',
    originalSize: '2.5',
    price: '3200',
    filledSize: '2.5',
    remainingSize: '0',
    status: 'filled',
    timestamp: Date.now() - 259200000, // 3 days ago
    lastUpdated: Date.now() - 259200000,
    providerId: 'hyperliquid',
  },
];

/**
 * Mock order fills for trade history
 */
export const MOCK_ORDER_FILLS: OrderFill[] = [
  {
    orderId: 'filled-001',
    symbol: 'BTC',
    side: 'buy',
    size: '0.15',
    price: '65000',
    pnl: '0',
    direction: 'Open Long',
    fee: '4.39',
    feeToken: 'USDC',
    timestamp: Date.now() - 172800000,
    success: true,
    orderType: 'regular',
    providerId: 'hyperliquid',
  },
  {
    orderId: 'filled-002',
    symbol: 'ETH',
    side: 'sell',
    size: '2.5',
    price: '3200',
    pnl: '0',
    direction: 'Open Short',
    fee: '3.60',
    feeToken: 'USDC',
    timestamp: Date.now() - 259200000,
    success: true,
    orderType: 'regular',
    providerId: 'hyperliquid',
  },
  {
    orderId: 'filled-003',
    symbol: 'SOL',
    side: 'buy',
    size: '25',
    price: '175.50',
    pnl: '0',
    direction: 'Open Long',
    fee: '1.97',
    feeToken: 'USDC',
    timestamp: Date.now() - 345600000, // 4 days ago
    success: true,
    orderType: 'regular',
    providerId: 'hyperliquid',
  },
  {
    orderId: 'filled-004',
    symbol: 'BTC',
    side: 'sell',
    size: '0.05',
    price: '96500',
    pnl: '75.25',
    direction: 'Partial Close Long',
    fee: '2.17',
    feeToken: 'USDC',
    timestamp: Date.now() - 86400000, // 1 day ago
    success: true,
    orderType: 'regular',
    providerId: 'hyperliquid',
  },
];

/**
 * Mock funding payments
 */
export const MOCK_FUNDING: Funding[] = [
  {
    symbol: 'BTC',
    amountUsd: '-2.45',
    rate: '0.0001',
    timestamp: Date.now() - 8 * 60 * 60 * 1000, // 8 hours ago
  },
  {
    symbol: 'ETH',
    amountUsd: '1.85',
    rate: '-0.00008',
    timestamp: Date.now() - 8 * 60 * 60 * 1000,
  },
  {
    symbol: 'BTC',
    amountUsd: '-2.15',
    rate: '0.00009',
    timestamp: Date.now() - 16 * 60 * 60 * 1000, // 16 hours ago
  },
  {
    symbol: 'ETH',
    amountUsd: '1.65',
    rate: '-0.00007',
    timestamp: Date.now() - 16 * 60 * 60 * 1000,
  },
  {
    symbol: 'SOL',
    amountUsd: '-4.50',
    rate: '0.00015',
    timestamp: Date.now() - 8 * 60 * 60 * 1000,
  },
];

/**
 * Empty arrays for no-data states
 */
export const MOCK_EMPTY_ORDERS: Order[] = [];
export const MOCK_EMPTY_ORDER_FILLS: OrderFill[] = [];
export const MOCK_EMPTY_FUNDING: Funding[] = [];
