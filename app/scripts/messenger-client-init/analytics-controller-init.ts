import {
  AnalyticsController,
  type AnalyticsControllerMessenger,
  type AnalyticsControllerState,
} from '@metamask/analytics-controller';
import { registerABTestAnalyticsMapping } from '../../../shared/lib/ab-testing/ab-test-analytics';
import { CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING } from '../../../shared/lib/ab-testing/configs/chain-value-order';
import { PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING } from '../../../shared/lib/ab-testing/configs/perps-tab-badge';
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
 * @param request.extension - The webextension polyfill instance.
 * @returns The initialized controller.
 */
export const AnalyticsControllerInit: MessengerClientInitFunction<
  AnalyticsController,
  AnalyticsControllerMessenger,
  AnalyticsControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState, extension }) => {
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
    isGeolocationEnabled: true,
    isEventFragmentsEnabled: true,
  });
  registerABTestAnalyticsMapping(CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING);
  registerABTestAnalyticsMapping(PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING);
  controller.init();

  configureAnalytics({
    messenger: initMessenger,
    extension,
  });

  return { messengerClient: controller };
};
