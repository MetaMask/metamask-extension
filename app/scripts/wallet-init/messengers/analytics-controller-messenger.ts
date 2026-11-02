import { Messenger } from '@metamask/messenger';
import type {
  AnalyticsControllerCreateEventFragmentAction,
  AnalyticsControllerFinalizeEventFragmentAction,
  AnalyticsControllerGetEventFragmentByIdAction,
  AnalyticsControllerGetStateAction,
  AnalyticsControllerIdentifyAction,
  AnalyticsControllerOptInAction,
  AnalyticsControllerOptInToMarketingAction,
  AnalyticsControllerOptOutAction,
  AnalyticsControllerOptOutOfMarketingAction,
  AnalyticsControllerResetConsentDecisionAction,
  AnalyticsControllerSetMarketingCampaignCookieIdAction,
  AnalyticsControllerTrackEventAction,
  AnalyticsControllerTrackViewAction,
  AnalyticsControllerUpdateEventFragmentAction,
  AnalyticsControllerUpsertEventFragmentAction,
} from '@metamask/analytics-controller';
import type {
  ConfigRegistryControllerGetStateAction,
  ConfigRegistryControllerStateChangedEvent,
} from '@metamask/config-registry-controller';
import type { MultichainNetworkControllerGetStateAction } from '@metamask/multichain-network-controller';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import type { RootMessenger } from '../../lib/messenger';
import type {
  SentryTracingServiceClearTracesAfterMetricsOptInAction,
  SentryTracingServiceTrackTracesAfterMetricsOptInAction,
} from '../../services/sentry/sentry-tracing-service-method-action-types';

export type AnalyticsControllerInitMessengerActions =
  | ConfigRegistryControllerGetStateAction
  | PreferencesControllerGetStateAction
  | MultichainNetworkControllerGetStateAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction
  | AnalyticsControllerSetMarketingCampaignCookieIdAction
  | AnalyticsControllerGetStateAction
  | AnalyticsControllerTrackEventAction
  | AnalyticsControllerIdentifyAction
  | AnalyticsControllerTrackViewAction
  | AnalyticsControllerOptInAction
  | AnalyticsControllerOptInToMarketingAction
  | AnalyticsControllerOptOutAction
  | AnalyticsControllerOptOutOfMarketingAction
  | AnalyticsControllerResetConsentDecisionAction
  | AnalyticsControllerCreateEventFragmentAction
  | AnalyticsControllerUpsertEventFragmentAction
  | AnalyticsControllerUpdateEventFragmentAction
  | AnalyticsControllerGetEventFragmentByIdAction
  | AnalyticsControllerFinalizeEventFragmentAction
  | SentryTracingServiceTrackTracesAfterMetricsOptInAction
  | SentryTracingServiceClearTracesAfterMetricsOptInAction;

export type AnalyticsControllerInitMessengerEvents =
  ConfigRegistryControllerStateChangedEvent;

export type AnalyticsControllerInitMessenger = ReturnType<
  typeof getAnalyticsControllerInitMessenger
>;

/**
 * Create a messenger restricted to the actions and events the extension-side
 * analytics helpers need. The wallet-owned `AnalyticsController` builds its
 * own controller messenger; this init messenger is only for platform-adapter
 * enrichment and `configureAnalytics`.
 *
 * @param messenger - The root messenger used to create the restricted messenger.
 * @returns The restricted analytics init messenger.
 */
export function getAnalyticsControllerInitMessenger(
  messenger: RootMessenger<
    AnalyticsControllerInitMessengerActions,
    AnalyticsControllerInitMessengerEvents
  >,
) {
  const analyticsControllerInitMessenger = new Messenger<
    'AnalyticsControllerInit',
    AnalyticsControllerInitMessengerActions,
    AnalyticsControllerInitMessengerEvents,
    typeof messenger
  >({
    namespace: 'AnalyticsControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: analyticsControllerInitMessenger,
    actions: [
      'PreferencesController:getState',
      'MultichainNetworkController:getState',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
      'AnalyticsController:getState',
      'AnalyticsController:trackEvent',
      'AnalyticsController:identify',
      'AnalyticsController:trackView',
      'AnalyticsController:optIn',
      'AnalyticsController:optInToMarketing',
      'AnalyticsController:optOut',
      'AnalyticsController:optOutOfMarketing',
      'AnalyticsController:resetConsentDecision',
      'AnalyticsController:setMarketingCampaignCookieId',
      'AnalyticsController:createEventFragment',
      'AnalyticsController:upsertEventFragment',
      'AnalyticsController:updateEventFragment',
      'AnalyticsController:getEventFragmentById',
      'AnalyticsController:finalizeEventFragment',
      'SentryTracingService:trackTracesAfterMetricsOptIn',
      'SentryTracingService:clearTracesAfterMetricsOptIn',
      'ConfigRegistryController:getState',
    ],
    events: ['ConfigRegistryController:stateChanged'],
  });

  return analyticsControllerInitMessenger;
}
