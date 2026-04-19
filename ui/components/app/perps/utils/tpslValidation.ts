/**
 * Utility functions for validating Take Profit and Stop Loss prices
 * based on position direction and current market price.
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

type ValidationParams = {
  currentPrice: number;
  direction?: Direction;
  liquidationPrice?: number | null;
};

export type StopLossValidationResult = {
  isValid: boolean;
  direction: 'above' | 'below' | '';
  referencePrice: 'current' | 'liquidation' | '';
};

/**
 * Validates if a take profit price is on the correct side of the reference price.
 * Returns `true` when the price is valid **or** when inputs are incomplete (empty/NaN).
 *
 * @param price - The take profit price string (may include `$` / `,` formatting)
 * @param params - Object with `currentPrice` and `direction`
 * @param params.currentPrice
 * @param params.direction
 */
export const isValidTakeProfitPrice = (
  price: string,
  { currentPrice, direction }: ValidationParams,
): boolean => {
  if (!currentPrice || !direction || !price) {
    return true;
  }

  const tpPrice = Number.parseFloat(price.replaceAll(/[$,]/gu, ''));
  if (Number.isNaN(tpPrice)) {
    return true;
  }

  return direction === 'long' ? tpPrice > currentPrice : tpPrice < currentPrice;
};

/**
 * Validates if a stop loss price is on the correct side of the reference price.
 * Returns `true` when the price is valid **or** when inputs are incomplete (empty/NaN).
 *
 * @param price - The stop loss price string (may include `$` / `,` formatting)
 * @param params - Object with `currentPrice` and `direction`
 * @param params.currentPrice
 * @param params.direction
 */
export function isValidStopLossPrice(price: string, params: ValidationParams) {
  return getStopLossValidationResult(price, params).isValid;
}

/**
 * Validates stop loss against both the current price and, when available,
 * the liquidation price. A valid stop loss must stay between those two
 * boundaries for the current position direction.
 *
 * @param price - The stop loss price string (may include `$` / `,` formatting)
 * @param params - Object with `currentPrice`, `direction`, and optional `liquidationPrice`
 * @param params.currentPrice
 * @param params.direction
 * @param params.liquidationPrice
 */
export function getStopLossValidationResult(
  price: string,
  { currentPrice, direction, liquidationPrice }: ValidationParams,
): StopLossValidationResult {
  if (!currentPrice || !direction || !price) {
    return { isValid: true, direction: '', referencePrice: '' };
  }

  const slPrice = Number.parseFloat(price.replaceAll(/[$,]/gu, ''));
  if (Number.isNaN(slPrice)) {
    return { isValid: true, direction: '', referencePrice: '' };
  }

  const isWithinCurrentBoundary =
    direction === 'long' ? slPrice < currentPrice : slPrice > currentPrice;

  if (!isWithinCurrentBoundary) {
    return {
      isValid: false,
      direction: direction === 'long' ? 'below' : 'above',
      referencePrice: 'current',
    };
  }

  if (
    liquidationPrice === undefined ||
    liquidationPrice === null ||
    !Number.isFinite(liquidationPrice) ||
    liquidationPrice <= 0
  ) {
    return { isValid: true, direction: '', referencePrice: '' };
  }

  const isWithinLiquidationBoundary =
    direction === 'long'
      ? slPrice > liquidationPrice
      : slPrice < liquidationPrice;

  if (!isWithinLiquidationBoundary) {
    return {
      isValid: false,
      direction: direction === 'long' ? 'above' : 'below',
      referencePrice: 'liquidation',
    };
  }

  return { isValid: true, direction: '', referencePrice: '' };
}

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
