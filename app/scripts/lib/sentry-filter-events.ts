import {
  Event as SentryEvent,
  EventProcessor,
  Hub,
  Integration,
} from '@sentry/types';
import { logger } from '@sentry/utils';

/**
 * Filter events when MetaMetrics is disabled.
 */
export class FilterEvents implements Integration {
  /**
   * Property that holds the integration name.
   */
  public static id = 'FilterEvents';

  /**
   * Another property that holds the integration name.
   *
   * I don't know why this exists, but the other Sentry integrations have it.
   */
  public name: string = FilterEvents.id;

  /**
   * A function that returns whether MetaMetrics is enabled. This should also
   * return `false` if state has not yet been initialzed.
   *
   * @returns `true` if MetaMask's state has been initialized, and MetaMetrics
   * is enabled, `false` otherwise.
   */
  private getMetaMetricsEnabled: () => Promise<boolean>;

  /**
   * @param options - Constructor options.
   * @param options.getMetaMetricsEnabled - A function that returns whether
   * MetaMetrics is enabled. This should also return `false` if state has not
   * yet been initialzed.
   */
  constructor({
    getMetaMetricsEnabled,
  }: {
    getMetaMetricsEnabled: () => Promise<boolean>;
  }) {
    this.getMetaMetricsEnabled = getMetaMetricsEnabled;
  }

  /**
   * Setup the integration.
   *
   * @param addGlobalEventProcessor - A function that allows adding a global
   * event processor.
   * @param getCurrentHub - A function that returns the current Sentry hub.
   */
  public setupOnce(
    addGlobalEventProcessor: (callback: EventProcessor) => void,
    getCurrentHub: () => Hub,
  ): void {
    addGlobalEventProcessor(async (currentEvent: SentryEvent) => {
      // Sentry integrations use the Sentry hub to get "this" references, for
      // reasons I don't fully understand.
      // eslint-disable-next-line consistent-this
      const self = getCurrentHub().getIntegration(FilterEvents);
      if (self) {
        if (!(await self.getMetaMetricsEnabled())) {
          logger.warn(`Event dropped due to MetaMetrics setting.`);
          return null;
        }
      }
      return currentEvent;
    });
  }
}
