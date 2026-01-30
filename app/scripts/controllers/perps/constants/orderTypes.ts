/**
 * Detailed order types from HyperLiquid API
 */
export const DETAILED_ORDER_TYPES = {
  LIMIT: 'Limit',
  MARKET: 'Market',
  STOP_LIMIT: 'Stop Limit',
  STOP_MARKET: 'Stop Market',
  TAKE_PROFIT_LIMIT: 'Take Profit Limit',
  TAKE_PROFIT_MARKET: 'Take Profit Market',
} as const;

/**
 * Check if an order type is a TP/SL order.
 *
 * @param detailedOrderType - The detailed order type string
 * @returns True if the order type is a TP/SL order
 */
export const isTPSLOrder = (detailedOrderType?: string): boolean => {
  if (!detailedOrderType) {
    return false;
  }
  return (
    detailedOrderType === DETAILED_ORDER_TYPES.STOP_LIMIT ||
    detailedOrderType === DETAILED_ORDER_TYPES.STOP_MARKET ||
    detailedOrderType === DETAILED_ORDER_TYPES.TAKE_PROFIT_LIMIT ||
    detailedOrderType === DETAILED_ORDER_TYPES.TAKE_PROFIT_MARKET
  );
};
