/**
 * Perps shared types and re-exports.
 */

export type PerpsBackgroundResult = {
  success: boolean;
  error?: string;
};

export {
  PerpsOrderTransactionStatus,
  PerpsOrderTransactionStatusType,
  FillType,
  type PerpsTransaction,
  type PerpsTransactionFilter,
  type TransactionSection,
} from './transactionHistory';

export type {
  Order,
  Position,
  AccountState,
  PerpsMarketData,
  OrderFill,
  OrderType,
} from '@metamask/perps-controller';
