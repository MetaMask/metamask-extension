import { Event as SentryEvent, Integration } from '@sentry/types';

const NAME = 'FilterEvents';

/**
 * Filter events when MetaMetrics is disabled.
 *
 * @param options - Options bag.
 * @param options.getMetaMetricsEnabled - Function that returns whether MetaMetrics is enabled.
 * @param options.log - Function to log messages.
 */
export function filterEvents({
  getMetaMetricsEnabled,
  log,
}: {
  getMetaMetricsEnabled: () => Promise<boolean>;
  log: (message: string) => void;
}): Integration {
  return {
    name: NAME,
    processEvent: async (event: SentryEvent) => {
      // This integration is required in addition to the custom transport as it provides an
      // asynchronous context which we may need in order to read the persisted state from the
      // store, so it can later be added to the event via the `beforeSend` overload.
      // It also provides a more native solution for discarding events, but any
      // session requests will always be handled by the custom transport.
      const metricsEnabled = await getMetaMetricsEnabled();

      if (!metricsEnabled) {
        log('Event dropped as metrics disabled');
        return null;
      }

      return event;
    },
  };
}
