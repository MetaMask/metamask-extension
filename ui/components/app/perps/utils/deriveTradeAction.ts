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
 * - opposite direction -> flip_long_to_short / flip_short_to_long
 *
 * The controller forwards this verbatim as the transaction `action` property
 * (via `trackingData.tradeAction`), and the client PERPS_TRANSACTION_CONSIDERED
 * event uses the same derivation so the considered and executed events agree.
 *
 * @param existingDirection - The existing position direction, or null when flat.
 * @param orderDirection - The incoming order direction.
 * @returns The derived trade action.
 */
export function derivePerpsTradeAction(
  existingDirection: 'long' | 'short' | null,
  orderDirection: 'long' | 'short',
): PerpsTradeAction {
  if (!existingDirection) {
    return PERPS_EVENT_VALUE.ACTION.CREATE_POSITION;
  }
  if (existingDirection === orderDirection) {
    return PERPS_EVENT_VALUE.ACTION.INCREASE_EXPOSURE;
  }
  return existingDirection === 'long'
    ? PERPS_EVENT_VALUE.ACTION.FLIP_LONG_TO_SHORT
    : PERPS_EVENT_VALUE.ACTION.FLIP_SHORT_TO_LONG;
}
