import { BigNumber } from 'bignumber.js';
import {
  CLOSE_POSITION_CONFIG,
  estimateCloseReceive,
  type CloseReceiveEstimate,
  type CloseReceiveEstimateParams,
  type PerpsActiveProviderMode,
  type PerpsProviderType,
  type Position,
} from '@metamask/perps-controller';

export const MAX_CLOSE_LIMIT_PRICE_DEVIATION = 0.95;

/** Shown for a close figure that is not available yet. */
export const PERPS_CLOSE_UNAVAILABLE_DISPLAY = '--';

type PriceValue = number | string | null | undefined;

/**
 * Parses a price and rejects zero, negative, and non-finite values.
 *
 * @param value - A raw numeric or formatted string price.
 * @returns The parsed positive price, or `null` when invalid.
 */
export function parsePositivePrice(value: PriceValue): number | null {
  const parsed =
    typeof value === 'string'
      ? Number.parseFloat(value.replaceAll(/[$,]/gu, ''))
      : value;

  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0
    ? parsed
    : null;
}

/**
 * Chooses the live reference used by HyperLiquid's oracle-deviation guard.
 *
 * @param prices - Available live prices in priority order.
 * @param prices.markPrice - Oracle mark price.
 * @param prices.currentPrice - Current market price.
 * @param prices.midPrice - Optional top-of-book midpoint.
 * @returns The first valid reference price, or `null`.
 */
export function getCloseLimitReferencePrice({
  markPrice,
  currentPrice,
  midPrice,
}: {
  markPrice?: number | string;
  currentPrice: number;
  midPrice?: number;
}): number | null {
  return (
    parsePositivePrice(markPrice) ??
    parsePositivePrice(currentPrice) ??
    parsePositivePrice(midPrice)
  );
}

/**
 * Checks HyperLiquid's ratio-based oracle deviation band.
 *
 * The exact boundary remains valid; only values strictly outside are rejected.
 * Invalid prices are rejected so `NaN` cannot bypass final validation.
 *
 * @param limitPrice - Proposed close-limit price.
 * @param referencePrice - Live oracle/current reference price.
 * @param maxDeviation - Maximum ratio deviation.
 * @returns Whether the price is invalid or outside the allowed band.
 */
export function isCloseLimitPriceOutsideDeviation(
  limitPrice: PriceValue,
  referencePrice: PriceValue,
  maxDeviation = MAX_CLOSE_LIMIT_PRICE_DEVIATION,
): boolean {
  const parsedLimitPrice = parsePositivePrice(limitPrice);
  const parsedReferencePrice = parsePositivePrice(referencePrice);

  if (
    parsedLimitPrice === null ||
    parsedReferencePrice === null ||
    !Number.isFinite(maxDeviation) ||
    maxDeviation < 0 ||
    maxDeviation >= 1
  ) {
    return true;
  }

  const lowerPrice = Math.min(parsedLimitPrice, parsedReferencePrice);
  const higherPrice = Math.max(parsedLimitPrice, parsedReferencePrice);
  const boundary = (1 - maxDeviation) * higherPrice;
  const floatingPointTolerance = Number.EPSILON * higherPrice * 4;

  return lowerPrice + floatingPointTolerance < boundary;
}

const UNAVAILABLE_CLOSE_RECEIVE_ESTIMATE: CloseReceiveEstimate = {
  marginReturned: undefined,
  realizedPnl: undefined,
  fee: undefined,
  receive: undefined,
};

/**
 * The provider holding a position: set on the position under aggregation,
 * otherwise the active provider.
 *
 * @param position - The position being closed.
 * @param activeProvider - The controller's active provider mode.
 * @returns The provider, or `undefined` when an aggregated position names none.
 */
export function getClosePositionProviderId(
  position: Pick<Position, 'providerId'>,
  activeProvider: PerpsActiveProviderMode,
): PerpsProviderType | undefined {
  if (position.providerId) {
    return position.providerId;
  }
  return activeProvider === 'aggregated' ? undefined : activeProvider;
}

/**
 * Core's close estimate, or every figure unavailable when the provider holding
 * the position is unknown.
 *
 * @param params - Core's close inputs, with the provider possibly unknown.
 * @param params.providerId - Provider holding the position, if known.
 * @returns The close estimate.
 */
export function estimateClosePositionReceive({
  providerId,
  ...params
}: Omit<CloseReceiveEstimateParams, 'providerId'> & {
  providerId: PerpsProviderType | undefined;
}): CloseReceiveEstimate {
  return providerId === undefined
    ? UNAVAILABLE_CLOSE_RECEIVE_ESTIMATE
    : estimateCloseReceive({ ...params, providerId });
}

/**
 * Rounds a USD figure to the cents Core rounds a close's receive to, half away
 * from zero, so displayed rows add up to Core's `receive`.
 *
 * @param value - The USD figure.
 * @returns The rounded figure, or `undefined` when the figure is unavailable.
 */
export function roundCloseUsd(value: number | undefined): number | undefined {
  return value === undefined
    ? undefined
    : Number(
        // From a string: this `bignumber.js` rejects numbers with more than
        // 15 significant digits.
        new BigNumber(String(value)).toFixed(
          CLOSE_POSITION_CONFIG.UsdDecimalPlaces,
          BigNumber.ROUND_HALF_UP,
        ),
      );
}

/**
 * The margin a close returns with its realized PnL, rounded as Core rounds it
 * into `receive`.
 *
 * @param estimate - Core's close estimate.
 * @returns The rounded margin with PnL, or `undefined` when either is unknown.
 */
export function getCloseMarginWithPnl(
  estimate: CloseReceiveEstimate,
): number | undefined {
  const { marginReturned, realizedPnl } = estimate;
  return marginReturned === undefined || realizedPnl === undefined
    ? undefined
    : roundCloseUsd(
        new BigNumber(String(marginReturned))
          .plus(String(realizedPnl))
          .toNumber(),
      );
}
