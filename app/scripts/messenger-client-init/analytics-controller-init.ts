import {
  AnalyticsController,
  type AnalyticsControllerMessenger,
  type AnalyticsControllerState,
} from '@metamask/analytics-controller';
import { generateMetaMetricsId } from '../../../shared/lib/generate-metametrics-id';
import { configureAnalyticsEventBuilder } from '../controllers/analytics/analytics-event-builder-init';
import { configureAnalyticsDelivery } from '../controllers/analytics/analytics-delivery';
import { createPlatformAdapter } from '../controllers/analytics/platform-adapter';
import type { AnalyticsEventBuilderMessenger } from '../controllers/analytics/analytics-event-builder-messenger';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the analytics controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @param request.initMessenger
 * @returns The initialized controller.
 */
export const AnalyticsControllerInit: MessengerClientInitFunction<
  AnalyticsController,
  AnalyticsControllerMessenger,
  AnalyticsEventBuilderMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const persisted = {
    ...persistedState.AnalyticsController,
  };

  persisted.analyticsId =
    (typeof persisted.analyticsId === 'string' ? persisted.analyticsId : '') ||
    generateMetaMetricsId();
  persisted.optedIn = persisted.optedIn === true;

  configureAnalyticsEventBuilder({
    messenger: initMessenger,
    version: process.env.METAMASK_VERSION as string,
    environment: process.env.METAMASK_ENVIRONMENT as string,
  });

  configureAnalyticsDelivery({
    messenger: initMessenger,
  });

  const controller = new AnalyticsController({
    messenger: controllerMessenger,
    platformAdapter: createPlatformAdapter(),
    state: persisted as AnalyticsControllerState,
    isAnonymousEventsFeatureEnabled: true,
    isEventQueuePersistenceEnabled: true,
  });
  controller.init();

  return { messengerClient: controller };
};
