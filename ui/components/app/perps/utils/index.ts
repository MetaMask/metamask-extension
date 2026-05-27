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
  derivePositionTpslPricesFromOrders,
  willFlipPosition,
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

/**
 * Builds tracking data for perps analytics events that include VIP context.
 * @param options0
 * @param options0.totalFee
 * @param options0.marketPrice
 * @param options0.vipTier
 * @param options0.vipDiscount
 */
export function buildPerpsVipTrackingData({
  totalFee,
  marketPrice,
  vipTier,
  vipDiscount,
}: {
  totalFee: number;
  marketPrice: number;
  vipTier: number | null;
  vipDiscount: number | undefined;
}) {
  return {
    totalFee,
    marketPrice,
    ...(vipTier !== null && { vipTier }),
    ...(vipDiscount !== undefined && { vipDiscount }),
  };
}
