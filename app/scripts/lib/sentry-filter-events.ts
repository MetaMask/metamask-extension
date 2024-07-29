import { Event as SentryEvent, Integration } from '@sentry/types';
import { logger } from '@sentry/utils';

const NAME = 'FilterEvents';

/**
 * Filter events when MetaMetrics is disabled.
 *
 * @param options - Options bag.
 * @param options.getMetaMetricsEnabled - Function that returns whether MetaMetrics is enabled.
 */
export function filterEvents({
  getMetaMetricsEnabled,
}: {
  getMetaMetricsEnabled: () => Promise<boolean>;
}): Integration {
  return {
    name: NAME,
    processEvent: async (event: SentryEvent) => {
      if (!(await getMetaMetricsEnabled())) {
        logger.warn(`Event dropped due to MetaMetrics setting.`);
        return null;
      }

      return event;
    },
  };
}
