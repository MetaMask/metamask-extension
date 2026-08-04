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
import { isRampsAnalyticsEnabled } from './isRampsAnalyticsEnabled';

type RampsOrderStatusChangedEventPayload =
  RampsControllerOrderStatusChangedEvent['payload'][0];

// Dedupe set for terminal-order KPIs. Grows by one entry per
// completed/failed order for the service worker's lifetime. In practice the
// count is small (bounded by user ramp activity), and an MV3 service-worker
// restart clears the set — which is safe because polling skips terminal
// orders, so a restarted worker won't re-emit for an already-terminal order.
const emittedTerminalOrders = new Set<string>();

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
 * Fires the ramps buy-flow terminal-outcome KPI (completed / failed) for an
 * order that reached a terminal status, from either source: the polled
 * `orderStatusChanged` transition, or an order resolved already-terminal from
 * the checkout callback — which publishes no event and is never polled, since
 * polling skips terminal orders.
 *
 * Only COMPLETED and FAILED are emitted; canceled is deferred.
 *
 * @param order - The order to evaluate.
 */
export function trackRampsTerminalOrder(order?: RampsOrder): void {
  if (!isRampsAnalyticsEnabled()) {
    return;
  }

  // Dedupe on the canonical `{providerId}/orders/{orderCode}` id so a callback
  // emit and an in-flight poll emit for one order can't double-count. Not on the
  // bare order code: that is only unique within a single provider (and can be a
  // custom id we generated), so it would swallow another provider's order.
  const orderCode = order && getInternalOrderCode(order);
  const orderKey =
    order?.id ??
    (orderCode
      ? `${order?.provider?.id ?? ''}/orders/${orderCode}`
      : undefined);
  if (orderKey && emittedTerminalOrders.has(orderKey)) {
    return;
  }

  // Status strings are RampsOrderStatus values from @metamask/ramps-controller.
  if (order?.status === 'COMPLETED') {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.RampsTransactionCompleted)
        .addCategory(MetaMetricsEventCategory.Ramps)
        .addProperties(buildRampsTransactionCompletedProperties(order))
        .build(),
    );
  } else if (order?.status === 'FAILED' || order?.status === 'ID_EXPIRED') {
    // Mobile treats ID_EXPIRED as a failure (same payload).
    trackEvent(
      createEventBuilder(MetaMetricsEventName.RampsTransactionFailed)
        .addCategory(MetaMetricsEventCategory.Ramps)
        .addProperties(buildRampsTransactionFailedProperties(order))
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
 */
export function trackRampsTransactionConfirmed(
  order?: RampsOrder,
  region?: string,
): void {
  if (!order || TERMINAL_ORDER_STATUSES.has(order.status)) {
    return;
  }

  if (!isRampsAnalyticsEnabled()) {
    return;
  }

  trackEvent(
    createEventBuilder(MetaMetricsEventName.RampsTransactionConfirmed)
      .addCategory(MetaMetricsEventCategory.Ramps)
      .addProperties(buildRampsTransactionConfirmedProperties(order, region))
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
