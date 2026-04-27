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
  formatOrderLabel,
} from './orderUtils';

export { formatPerpsPrice, type PerpsPriceRange } from './formatPerpsPrice';

export {
  parsePerpsDisplayPrice,
  normalizePerpsDisplayPrice,
  formatPerpsFiatMinimal,
  formatPerpsFiatUniversal,
} from './formatPerpsDisplayPrice';

export {
  isValidTakeProfitPrice,
  isValidStopLossPrice,
  getTakeProfitErrorDirection,
  getStopLossErrorDirection,
} from './tpslValidation';
