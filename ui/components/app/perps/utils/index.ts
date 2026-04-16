/**
 * Perps Utility Functions
 *
 * Exports utility functions for the Perps feature.
 */

export {
  aggregateFillsByTimestamp,
  transformFillsToTransactions,
  transformOrdersToTransactions,
  transformFundingToTransactions,
  transformUserHistoryToTransactions,
  transformWithdrawalRequestsToTransactions,
  transformDepositRequestsToTransactions,
  type WithdrawalRequest,
  type DepositRequest,
} from './transactionTransforms';

export {
  normalizeMarketDetailsOrders,
  shouldDisplayOrderInMarketDetailsOrders,
  buildDisplayOrdersWithSyntheticTpsl,
  isOrderAssociatedWithFullPosition,
} from './orderUtils';

export {
  formatPerpsPrice,
  PRICE_RANGES_UNIVERSAL,
  type PerpsPriceRange,
} from './formatPerpsPrice';

export {
  isValidTakeProfitPrice,
  isValidStopLossPrice,
  getTakeProfitErrorDirection,
  getStopLossErrorDirection,
} from './tpslValidation';
