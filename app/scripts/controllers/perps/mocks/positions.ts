import type { Position } from '@metamask/perps-controller';

/**
 * Mock positions for development and testing
 * Includes both long and short positions with realistic P&L
 */
export const MOCK_POSITIONS: Position[] = [
  {
    symbol: 'BTC',
    size: '0.15', // Long position (positive size)
    entryPrice: '65000',
    positionValue: '9750',
    unrealizedPnl: '250',
    marginUsed: '1950',
    leverage: { type: 'cross', value: 5 },
    liquidationPrice: '52000',
    maxLeverage: 50,
    returnOnEquity: '12.82',
    cumulativeFunding: {
      allTime: '-15.50',
      sinceOpen: '-8.25',
      sinceChange: '-2.10',
    },
    takeProfitPrice: '75000',
    stopLossPrice: '58000',
    takeProfitCount: 1,
    stopLossCount: 1,
    providerId: 'hyperliquid',
  },
  {
    symbol: 'ETH',
    size: '-2.5', // Short position (negative size)
    entryPrice: '3200',
    positionValue: '8000',
    unrealizedPnl: '100',
    marginUsed: '2000',
    leverage: { type: 'cross', value: 4 },
    liquidationPrice: '3800',
    maxLeverage: 50,
    returnOnEquity: '5.00',
    cumulativeFunding: {
      allTime: '12.30',
      sinceOpen: '5.15',
      sinceChange: '1.85',
    },
    takeProfitPrice: '2900',
    stopLossPrice: '3500',
    takeProfitCount: 1,
    stopLossCount: 1,
    providerId: 'hyperliquid',
  },
  {
    symbol: 'SOL',
    size: '25', // Long position
    entryPrice: '175.50',
    positionValue: '4387.50',
    unrealizedPnl: '-87.50',
    marginUsed: '876.50',
    leverage: { type: 'isolated', value: 5, rawUsd: '876.50' },
    liquidationPrice: '142.25',
    maxLeverage: 20,
    returnOnEquity: '-9.98',
    cumulativeFunding: {
      allTime: '-22.40',
      sinceOpen: '-12.80',
      sinceChange: '-4.50',
    },
    takeProfitCount: 0,
    stopLossCount: 0,
    providerId: 'hyperliquid',
  },
];

/**
 * Mock single BTC long position
 */
export const MOCK_BTC_LONG: Position = {
  symbol: 'BTC',
  size: '0.5',
  entryPrice: '95000',
  positionValue: '47500',
  unrealizedPnl: '1250',
  marginUsed: '9500',
  leverage: { type: 'cross', value: 5 },
  liquidationPrice: '76000',
  maxLeverage: 50,
  returnOnEquity: '13.16',
  cumulativeFunding: {
    allTime: '-45.20',
    sinceOpen: '-22.10',
    sinceChange: '-8.50',
  },
  takeProfitPrice: '110000',
  stopLossPrice: '88000',
  takeProfitCount: 1,
  stopLossCount: 1,
  providerId: 'hyperliquid',
};

/**
 * Mock single ETH short position
 */
export const MOCK_ETH_SHORT: Position = {
  symbol: 'ETH',
  size: '-5',
  entryPrice: '3500',
  positionValue: '17500',
  unrealizedPnl: '375',
  marginUsed: '3500',
  leverage: { type: 'cross', value: 5 },
  liquidationPrice: '4200',
  maxLeverage: 50,
  returnOnEquity: '10.71',
  cumulativeFunding: {
    allTime: '28.90',
    sinceOpen: '14.45',
    sinceChange: '5.20',
  },
  takeProfitPrice: '3000',
  stopLossPrice: '3800',
  takeProfitCount: 1,
  stopLossCount: 1,
  providerId: 'hyperliquid',
};

/**
 * Empty positions array for no-position state
 */
export const MOCK_EMPTY_POSITIONS: Position[] = [];
