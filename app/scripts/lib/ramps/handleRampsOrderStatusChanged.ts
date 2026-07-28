import type { RampsOrder, RampsOrderStatus } from '@metamask/ramps-controller';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type {
  AnalyticsEvent,
  AnalyticsEventBuilder,
} from '../../../../shared/lib/analytics/create-event-builder';
import {
  buildRampsTransactionCompletedProperties,
  buildRampsTransactionFailedProperties,
} from './buildRampsTransactionCompletedProperties';

type RampsOrderStatusChangedEvent = {
  order: RampsOrder;
  previousStatus: RampsOrderStatus;
};

type Analytics = {
  trackEvent: (built: AnalyticsEvent) => void;
  createEventBuilder: (eventName: string) => AnalyticsEventBuilder;
};

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
 * @param analytics - The background `trackEvent` / `createEventBuilder` pair.
 * @param analytics.trackEvent - Submits a built analytics event.
 * @param analytics.createEventBuilder - Builds an event by name.
 */
export function handleRampsOrderStatusChanged(
  { order }: RampsOrderStatusChangedEvent,
  { trackEvent, createEventBuilder }: Analytics,
): void {
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
