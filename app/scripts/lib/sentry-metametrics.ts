import {
  type Client,
  Event as SentryEvent,
  EventHint,
  Integration,
} from '@sentry/types';

import type { AnalyticsParticipation } from './sentry-get-state';

const NAME = 'MetaMetrics';

/**
 * Drops Sentry events when analytics is disabled, and attaches `user.id` from the same
 * async analytics resolution used for that check (persisted / backup when the in-memory
 * snapshot is not ready yet).
 *
 * @param options - Options bag.
 * @param options.getAnalyticsState - Resolves analytics state and id (e.g. `getAnalyticsState`).
 * @param options.log - Function to log messages.
 */
export function metaMetricsIntegration({
  getAnalyticsState,
  log,
}: {
  getAnalyticsState: () => Promise<AnalyticsParticipation>;
  log: (message: string) => void;
}): Integration {
  return {
    name: NAME,
    processEvent: async (
      event: SentryEvent,
      _hint: EventHint,
      _client: Client,
    ) => {
      // This integration is required in addition to the custom transport as it provides an
      // asynchronous context which we may need in order to read the persisted state from the
      // store, so it can later be added to the event via the `beforeSend` overload.
      // It also provides a more native solution for discarding events, but any
      // session requests will always be handled by the custom transport.
      const analyticsState = await getAnalyticsState();

      if (
        !analyticsState?.completedMetaMetricsOnboarding ||
        !analyticsState.optedIn
      ) {
        log('Event dropped as metrics disabled');
        return null;
      }

      if (analyticsState.analyticsId) {
        event.user = {
          ...event.user,
          id: analyticsState.analyticsId,
        };
      }

      return event;
    },
  };
}
