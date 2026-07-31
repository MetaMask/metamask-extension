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

// ponytail: unbounded in theory, one entry per terminal order per background
// session in practice; swap for an LRU if that ever stops being true.
const emittedTerminalOrders = new Set<string>();

/**
 * Fires the ramps buy-flow terminal-outcome KPI (completed / failed) for an
 * order that reached a terminal status, from either source: the polling
 * `orderStatusChanged` transition or an order resolved already-terminal from
 * the checkout callback (which publishes no event and is never polled, since
 * polling skips terminal orders). Deduped by order code so a callback emit and
 * an in-flight poll emit for the same order can't double-count.
 *
 * ponytail: COMPLETED/FAILED only, canceled deferred.
 *
 * @param order - The order to evaluate.
 */
export function trackRampsTerminalOrder(order?: RampsOrder): void {
  const orderCode = order && getInternalOrderCode(order);
  if (orderCode && emittedTerminalOrders.has(orderCode)) {
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

  if (orderCode) {
    emittedTerminalOrders.add(orderCode);
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
