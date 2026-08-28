import type { OrderType } from '@metamask/perps-controller';
import type {
  OrderDirection,
  OrderFormState,
} from '../../components/app/perps/order-entry/order-entry.types';

/**
 * Restore a trade draft only during a brief navigation away from
 * `/perps/trade/:symbol` (chart check, glance at another market).
 *
 * Core 13.x expires drafts at 30s; this 60s window is the Extension v1
 * product choice. The controller still stores the record — we enforce the
 * product TTL on read.
 */
export const PERPS_PENDING_TRADE_CONFIG_TTL_MS = 60_000;

export type PerpsPendingTradeDraft = {
  amount?: string;
  leverage?: number;
  takeProfitPrice?: string;
  stopLossPrice?: string;
  limitPrice?: string;
  orderType?: OrderType;
  direction?: OrderDirection;
};

export type PerpsPendingTradeConfigRecord = PerpsPendingTradeDraft & {
  timestamp: number;
};

/**
 * Whether a saved draft is still inside the restore window.
 *
 * @param timestamp - When the draft was saved, in ms.
 * @param now - Clock used for the age check.
 * @returns True when the draft should still be restored.
 */
export function isPendingTradeConfigFresh(
  timestamp: number,
  now: number = Date.now(),
): boolean {
  if (!Number.isFinite(timestamp)) {
    return false;
  }
  return now - timestamp <= PERPS_PENDING_TRADE_CONFIG_TTL_MS;
}

/**
 * Build the payload written to `savePendingTradeConfiguration`.
 *
 * Empty TP/SL/limit fields are omitted so a later restore cannot re-enable
 * auto-close from leftover blanks. Amount is the raw USD string without
 * grouping separators.
 *
 * @param formState - Live order form snapshot.
 * @returns Draft fields to persist for the current market.
 */
export function pendingDraftFromFormState(
  formState: OrderFormState,
): PerpsPendingTradeDraft {
  const amount = formState.amount.replace(/,/gu, '').trim();
  const parsedAmount = Number.parseFloat(amount);
  const takeProfitPrice =
    formState.autoCloseEnabled && formState.takeProfitPrice.trim()
      ? formState.takeProfitPrice
      : undefined;
  const stopLossPrice =
    formState.autoCloseEnabled && formState.stopLossPrice.trim()
      ? formState.stopLossPrice
      : undefined;
  const limitPrice =
    formState.type === 'limit' && formState.limitPrice.trim()
      ? formState.limitPrice
      : undefined;

  return {
    ...(Number.isFinite(parsedAmount) && parsedAmount > 0 ? { amount } : {}),
    leverage: formState.leverage,
    takeProfitPrice,
    stopLossPrice,
    limitPrice,
    orderType: formState.type,
    direction: formState.direction,
  };
}
