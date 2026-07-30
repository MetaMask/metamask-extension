import type { RampsControllerOrderStatusChangedEvent } from '@metamask/ramps-controller';
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

/**
 * Fires the ramps buy-flow terminal-outcome KPI for a `RampsController:
 * orderStatusChanged` event. `orderStatusChanged` only fires on a status
 * change, so this emits once on the transition into a terminal status.
 *
 * ponytail: COMPLETED/FAILED only (canceled deferred); an order added
 * already-terminal via the callback path isn't polled and won't emit here —
 * mirror mobile's callback emit if that gap needs closing.
 *
 * @param event - The `orderStatusChanged` event payload.
 * @param event.order - The order whose status changed.
 */
export function handleRampsOrderStatusChanged({
  order,
}: RampsOrderStatusChangedEventPayload): void {
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
  }
}
