import { PERPS_EVENT_VALUE } from '../../../../../shared/constants/perps-events';

export type PerpsTradeAction =
  | typeof PERPS_EVENT_VALUE.ACTION.CREATE_POSITION
  | typeof PERPS_EVENT_VALUE.ACTION.INCREASE_EXPOSURE
  | typeof PERPS_EVENT_VALUE.ACTION.FLIP_LONG_TO_SHORT
  | typeof PERPS_EVENT_VALUE.ACTION.FLIP_SHORT_TO_LONG;

/**
 * Derive the perps place-order trade action from the existing position
 * direction (null when flat) and the incoming order direction.
 *
 * - no position -> create_position
 * - same direction -> increase_exposure
 * - opposite direction, order larger than position -> flip_long_to_short or
 * flip_short_to_long
 * - opposite direction, order not larger -> undefined (a reduction, which the
 * controller contract has no ACTION value for)
 *
 * The controller forwards this verbatim as the transaction `action` property
 * (via `trackingData.tradeAction`), and the client PERPS_TRANSACTION_CONSIDERED
 * event uses the same derivation so the considered and executed events agree.
 *
 * @param existingDirection - The existing position direction, or null when flat.
 * @param orderDirection - The incoming order direction.
 * @param sizes - Order and position magnitudes, used to tell a flip from a
 * reduction. Omit only when the sizes are genuinely unknown.
 * @param sizes.orderSize - Absolute size of the incoming order.
 * @param sizes.positionSize - Signed or absolute size of the existing position.
 * @returns The derived trade action, or undefined when the order reduces rather
 * than flips (the contract has no value for that).
 */
export function derivePerpsTradeAction(
  existingDirection: 'long' | 'short' | null,
  orderDirection: 'long' | 'short',
  sizes?: { orderSize: number; positionSize: number },
): PerpsTradeAction | undefined {
  if (!existingDirection) {
    return PERPS_EVENT_VALUE.ACTION.CREATE_POSITION;
  }
  if (existingDirection === orderDirection) {
    return PERPS_EVENT_VALUE.ACTION.INCREASE_EXPOSURE;
  }
  // Opposite side only flips when it OVERSHOOTS the position; an equal or
  // smaller order reduces or closes it. Same rule as `willFlipPosition`, which
  // gates the flip confirmation UI — the two must agree or the event contradicts
  // what the user was shown. Sizes are optional so callers that genuinely cannot
  // know them keep the direction-only behaviour.
  if (sizes && sizes.orderSize <= Math.abs(sizes.positionSize)) {
    // The controller's ACTION enum has no "reduce exposure" member, so there is
    // no truthful value to report here. Omitted rather than mislabelled as a
    // flip: the controller only stamps `action` when `trackingData.tradeAction`
    // is set, so this leaves the property off instead of sending a wrong one.
    return undefined;
  }
  return existingDirection === 'long'
    ? PERPS_EVENT_VALUE.ACTION.FLIP_LONG_TO_SHORT
    : PERPS_EVENT_VALUE.ACTION.FLIP_SHORT_TO_LONG;
}
