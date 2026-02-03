import type { AccountState } from '@metamask/perps-controller';

/**
 * Mock account state for development and testing
 * Represents a realistic trading account with active positions
 */
export const MOCK_ACCOUNT: AccountState = {
  availableBalance: '8500.00',
  totalBalance: '12500.00',
  marginUsed: '4000.00',
  unrealizedPnl: '350.00',
  returnOnEquity: '8.75',
  subAccountBreakdown: {
    main: {
      availableBalance: '8500.00',
      totalBalance: '12500.00',
    },
  },
  providerId: 'hyperliquid',
};

/**
 * Mock empty account state for new users
 */
export const MOCK_EMPTY_ACCOUNT: AccountState = {
  availableBalance: '0.00',
  totalBalance: '0.00',
  marginUsed: '0.00',
  unrealizedPnl: '0.00',
  returnOnEquity: '0.00',
  providerId: 'hyperliquid',
};

/**
 * Mock funded account with no positions
 */
export const MOCK_FUNDED_ACCOUNT: AccountState = {
  availableBalance: '10000.00',
  totalBalance: '10000.00',
  marginUsed: '0.00',
  unrealizedPnl: '0.00',
  returnOnEquity: '0.00',
  providerId: 'hyperliquid',
};
