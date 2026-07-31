import {
  AnalyticsController,
  type AnalyticsControllerMessenger,
  type AnalyticsControllerState,
} from '@metamask/analytics-controller';
import { generateMetaMetricsId } from '../../../shared/lib/generate-metametrics-id';
import {
  configureAnalytics,
  getProfileIdentityProperties,
} from '../controllers/analytics/analytics';
import {
  createEnrichmentContext,
  createPlatformAdapter,
} from '../controllers/analytics/platform-adapter';
import { configureOptOutSegmentEnrichment } from '../lib/segment/custom-segment-tracking';
import type { AnalyticsControllerInitMessenger } from './messengers/analytics-controller-messenger';
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
  AnalyticsControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const persisted = {
    ...persistedState.AnalyticsController,
  };

  persisted.analyticsId =
    (typeof persisted.analyticsId === 'string' ? persisted.analyticsId : '') ||
    generateMetaMetricsId();
  persisted.optedIn = persisted.optedIn === true;

  const version = process.env.METAMASK_VERSION as string;
  const environment = process.env.METAMASK_ENVIRONMENT as string;
  const appVersion =
    environment === 'production' ? version : `${version}-${environment}`;
  const enrichmentContext = createEnrichmentContext(
    initMessenger,
    appVersion,
    getProfileIdentityProperties,
  );
  configureOptOutSegmentEnrichment(enrichmentContext);

  const controller = new AnalyticsController({
    messenger: controllerMessenger,
    platformAdapter: createPlatformAdapter(enrichmentContext),
    state: persisted as AnalyticsControllerState,
    isAnonymousEventsFeatureEnabled: true,
    isEventQueuePersistenceEnabled: true,
    isPreConsentQueueEnabled: true,
  });
  controller.init();

  configureAnalytics({
    messenger: initMessenger,
  });

  return { messengerClient: controller };
};
