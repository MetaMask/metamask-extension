import {
  AnalyticsController,
  type AnalyticsControllerMessenger,
  type AnalyticsControllerState,
} from '@metamask/analytics-controller';
import { generateMetaMetricsId } from '../../../shared/lib/generate-metametrics-id';
import { createPlatformAdapter } from '../controllers/analytics/platform-adapter';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the analytics controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @returns The initialized controller.
 */
export const AnalyticsControllerInit: MessengerClientInitFunction<
  AnalyticsController,
  AnalyticsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const persisted = {
    ...persistedState.AnalyticsController,
  };

  persisted.analyticsId =
    (typeof persisted.analyticsId === 'string' ? persisted.analyticsId : '') ||
    generateMetaMetricsId();
  persisted.optedIn = persisted.optedIn === true;

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
