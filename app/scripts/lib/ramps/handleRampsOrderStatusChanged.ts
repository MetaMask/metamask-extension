import {
  getInternalOrderCode,
  type RampsControllerOrderStatusChangedEvent,
  type RampsOrder,
} from '@metamask/ramps-controller';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import {
  buildRampsTransactionCompletedProperties,
  buildRampsTransactionConfirmedProperties,
  buildRampsTransactionFailedProperties,
} from './buildRampsTransactionCompletedProperties';

type RampsOrderStatusChangedEventPayload =
  RampsControllerOrderStatusChangedEvent['payload'][0];

// Dedupe set for terminal-order KPIs. Grows by one entry per
// completed/failed order for the service worker's lifetime. In practice the
// count is small (bounded by user ramp activity), and an MV3 service-worker
// restart clears the set — which is safe because polling skips terminal
// orders, so a restarted worker won't re-emit for an already-terminal order.
const emittedTerminalOrders = new Set<string>();

// Maps canonical order keys to the checkout session id that originated the
// order. Populated when the checkout watcher resolves an order from the
// callback URL (which has the session id in scope); read when a later
// `orderStatusChanged` poll fires the terminal KPI (which does not). Cleared
// on MV3 service-worker restart — same edge case as the dedupe set: the
// terminal KPI still fires, just without the session id.
const checkoutSessionByOrderKey = new Map<string, string>();

/**
 * Computes the canonical dedupe/join key for an order: the canonical `id` if
 * present, otherwise `{providerId}/orders/{orderCode}`. Not the bare order
 * code — that is only unique within a single provider (and can be a custom id
 * we generated), so it would swallow another provider's order.
 * @param order
 */
function getOrderKey(order?: RampsOrder): string | undefined {
  const orderCode = order && getInternalOrderCode(order);
  return (
    order?.id ??
    (orderCode ? `${order?.provider?.id ?? ''}/orders/${orderCode}` : undefined)
  );
}

/**
 * Terminal order statuses — mirrors `@metamask/ramps-controller`'s internal
 * `TERMINAL_ORDER_STATUSES` set (kept in lockstep with mobile's
 * `ramps-controller/event-handlers/analytics.ts`).
 */
const TERMINAL_ORDER_STATUSES = new Set<string>([
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'ID_EXPIRED',
]);

/**
 * Whether an order belongs to the unified buy funnel these KPIs describe.
 *
 * Every event here declares `ramp_type: UNIFIED_BUY_2`, so a sell order must
 * not be counted — mobile routes those to the separate `OFFRAMP_PURCHASE_*`
 * events. Uses the same rule as `mapRampsOrder` in `@metamask/client-utils`:
 * the V2 API uppercases `orderType`, locally-created stubs don't, and Transak
 * deposits are a buy variant rather than a sell.
 *
 * @param order - The order to classify.
 * @returns `true` when the order is a buy (or deposit) order.
 */
function isUnifiedBuyOrder(order: RampsOrder): boolean {
  const orderType = order.orderType?.toUpperCase();
  return orderType === 'BUY' || orderType === 'DEPOSIT';
}

/**
 * Fires the ramps buy-flow terminal-outcome KPI (completed / failed) for an
 * order that reached a terminal status, from either source: the polled
 * `orderStatusChanged` transition, or an order resolved already-terminal from
 * the checkout callback — which publishes no event and is never polled, since
 * polling skips terminal orders.
 *
 * Only COMPLETED and FAILED are emitted; canceled is deferred. Non-buy orders
 * are skipped — see `isUnifiedBuyOrder`.
 *
 * @param order - The order to evaluate.
 * @param checkoutSessionId - The checkout session id from the watcher context
 * (callback path). When omitted, the function looks up the session id from the
 * order-key map (polling path).
 */
export function trackRampsTerminalOrder(
  order?: RampsOrder,
  checkoutSessionId?: string,
): void {
  if (!order || !isUnifiedBuyOrder(order)) {
    return;
  }

  const orderKey = getOrderKey(order);

  // Record the session id for future polling-path lookups.
  if (orderKey && checkoutSessionId) {
    checkoutSessionByOrderKey.set(orderKey, checkoutSessionId);
  }

  // Resolve the session id: explicit arg (callback path) or map (polling path).
  const sessionId =
    checkoutSessionId ??
    (orderKey ? checkoutSessionByOrderKey.get(orderKey) : undefined);

  if (orderKey && emittedTerminalOrders.has(orderKey)) {
    return;
  }

  // Status strings are RampsOrderStatus values from @metamask/ramps-controller.
  if (order?.status === 'COMPLETED') {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.RampsTransactionCompleted)
        .addCategory(MetaMetricsEventCategory.Ramps)
        .addProperties(
          buildRampsTransactionCompletedProperties(order, sessionId),
        )
        .build(),
    );
  } else if (order?.status === 'FAILED' || order?.status === 'ID_EXPIRED') {
    // Mobile treats ID_EXPIRED as a failure (same payload).
    trackEvent(
      createEventBuilder(MetaMetricsEventName.RampsTransactionFailed)
        .addCategory(MetaMetricsEventCategory.Ramps)
        .addProperties(buildRampsTransactionFailedProperties(order, sessionId))
        .build(),
    );
  } else {
    return;
  }

  if (orderKey) {
    emittedTerminalOrders.add(orderKey);
  }
}

/**
 * Fires `ramps-transaction-confirmed` when a callback-fetched order is first
 * observed in a non-terminal state — the user has submitted the order for
 * processing but it has not reached a terminal outcome yet. Mirrors mobile's
 * `emitOrderConfirmedAnalyticsFromCallback` in metamask-mobile
 * `ramps-controller/event-handlers/analytics.ts`.
 *
 * No-ops for terminal orders (those emit via `trackRampsTerminalOrder` instead).
 *
 * @param order - The callback-resolved order to evaluate.
 * @param region - Optional region code from the checkout context.
 * @param checkoutSessionId - The checkout session id from the watcher context.
 */
export function trackRampsTransactionConfirmed(
  order?: RampsOrder,
  region?: string,
  checkoutSessionId?: string,
): void {
  if (
    !order ||
    !isUnifiedBuyOrder(order) ||
    TERMINAL_ORDER_STATUSES.has(order.status)
  ) {
    return;
  }

  // Record the session id for future polling-path terminal lookups.
  const orderKey = getOrderKey(order);
  if (orderKey && checkoutSessionId) {
    checkoutSessionByOrderKey.set(orderKey, checkoutSessionId);
  }

  trackEvent(
    createEventBuilder(MetaMetricsEventName.RampsTransactionConfirmed)
      .addCategory(MetaMetricsEventCategory.Ramps)
      .addProperties(
        buildRampsTransactionConfirmedProperties(
          order,
          region,
          checkoutSessionId,
        ),
      )
      .build(),
  );
}

/**
 * Subscriber for `RampsController:orderStatusChanged`.
 *
 * @param event - The `orderStatusChanged` event payload.
 * @param event.order - The order whose status changed.
 */
export function handleRampsOrderStatusChanged({
  order,
}: RampsOrderStatusChangedEventPayload): void {
  trackRampsTerminalOrder(order);
}
