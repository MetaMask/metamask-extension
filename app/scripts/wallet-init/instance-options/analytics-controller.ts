import type { AnalyticsControllerState } from '@metamask/analytics-controller';
import type { Json } from '@metamask/utils';
import type { WalletOptions } from '@metamask/wallet';
import type { Browser } from 'webextension-polyfill';
import { registerABTestAnalyticsMapping } from '../../../../shared/lib/ab-testing/ab-test-analytics';
import { CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING } from '../../../../shared/lib/ab-testing/configs/chain-value-order';
import { PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING } from '../../../../shared/lib/ab-testing/configs/perps-tab-badge';
import { generateMetaMetricsId } from '../../../../shared/lib/generate-metametrics-id';
import {
  configureAnalytics,
  getProfileIdentityProperties,
} from '../../controllers/analytics/analytics';
import {
  createEnrichmentContext,
  createPlatformAdapter,
} from '../../controllers/analytics/platform-adapter';
import { configureOptOutSegmentEnrichment } from '../../lib/segment/custom-segment-tracking';
import type { AnalyticsControllerInitMessenger } from '../messengers/analytics-controller-messenger';

type AnalyticsControllerInstanceOptions =
  WalletOptions['instanceOptions']['analyticsController'];

type GetAnalyticsControllerInstanceOptionsRequest = {
  initMessenger: AnalyticsControllerInitMessenger;
  state: Record<string, Record<string, Json>>;
  platform: Browser;
};

/**
 * Build the extension's client-specific options for the wallet-owned
 * `AnalyticsController`, including the Segment platform adapter and feature
 * flags. Also configures extension-side analytics helpers that depend on the
 * shared messenger.
 *
 * @param request - The request object.
 * @param request.initMessenger - Messenger used by platform-adapter enrichment
 * and `configureAnalytics`.
 * @param request.state - Persisted controller state.
 * @param request.platform - The webextension polyfill instance.
 * @returns The analytics controller instance options.
 */
export function getAnalyticsControllerInstanceOptions({
  initMessenger,
  state,
  platform,
}: GetAnalyticsControllerInstanceOptionsRequest): AnalyticsControllerInstanceOptions {
  const persisted = {
    ...state.AnalyticsController,
  } as Partial<AnalyticsControllerState>;

  const analyticsId =
    (typeof persisted.analyticsId === 'string' ? persisted.analyticsId : '') ||
    generateMetaMetricsId();

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

  registerABTestAnalyticsMapping(CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING);
  registerABTestAnalyticsMapping(PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING);

  configureAnalytics({
    messenger: initMessenger,
    extension: platform,
  });

  return {
    platformAdapter: createPlatformAdapter(enrichmentContext),
    analyticsId,
    isAnonymousEventsFeatureEnabled: true,
    isEventQueuePersistenceEnabled: true,
    isPreConsentQueueEnabled: true,
    isGeolocationEnabled: true,
    isEventFragmentsEnabled: true,
  };
}
