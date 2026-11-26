/**
 * Direction words for Take Profit and Stop Loss validation messages.
 *
 * The validation itself is Core's (`isValidTakeProfitPrice`,
 * `isValidStopLossPrice`, `isStopLossSafeFromLiquidation` and
 * `validateTPSLPrices` from `@metamask/perps-controller`):
 *
 * For Long positions:
 * - Take Profit must be above reference price (profit when price goes up)
 * - Stop Loss must be below reference price (loss when price goes down)
 *
 * For Short positions:
 * - Take Profit must be below reference price (profit when price goes down)
 * - Stop Loss must be above reference price (loss when price goes up)
 */

type Direction = 'long' | 'short';

/**
 * Returns the directional word for a take-profit validation error message.
 * Long TP must be "above"; Short TP must be "below".
 *
 * @param direction - Position direction
 */
export const getTakeProfitErrorDirection = (direction?: Direction): string => {
  if (!direction) {
    return '';
  }
  return direction === 'long' ? 'above' : 'below';
};

/**
 * Returns the directional word for a stop-loss validation error message.
 * Long SL must be "below"; Short SL must be "above".
 *
 * @param direction - Position direction
 */
export const getStopLossErrorDirection = (direction?: Direction): string => {
  if (!direction) {
    return '';
  }
  return direction === 'long' ? 'below' : 'above';
};

/**
 * Returns the directional word for a stop-loss liquidation validation error.
 * Long SL must be "above"; Short SL must be "below".
 *
 * @param direction - Position direction
 */
export const getStopLossLiquidationErrorDirection = (
  direction?: Direction,
): string => {
  if (!direction) {
    return '';
  }
  return getStopLossErrorDirection(direction === 'long' ? 'short' : 'long');
};
