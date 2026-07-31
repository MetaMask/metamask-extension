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
  buildRampsTransactionFailedProperties,
} from './buildRampsTransactionCompletedProperties';

type RampsOrderStatusChangedEventPayload =
  RampsControllerOrderStatusChangedEvent['payload'][0];

const emittedTerminalOrders = new Set<string>();

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
