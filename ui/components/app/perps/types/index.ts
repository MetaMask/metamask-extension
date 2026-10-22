/**
 * Perps shared types and re-exports.
 */

import type { PerpsErrorCode } from '@metamask/perps-controller';

export type PerpsBackgroundResult = {
  success: boolean;
  error?: string;
  errorCode?: PerpsErrorCode;
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
