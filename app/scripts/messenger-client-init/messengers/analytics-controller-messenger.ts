import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type {
  AnalyticsControllerMessenger,
  AnalyticsControllerGetStateAction,
  AnalyticsControllerIdentifyAction,
  AnalyticsControllerOptInAction,
  AnalyticsControllerOptOutAction,
  AnalyticsControllerResetConsentDecisionAction,
  AnalyticsControllerTrackEventAction,
  AnalyticsControllerTrackViewAction,
} from '@metamask/analytics-controller';
import type { MultichainNetworkControllerGetStateAction } from '@metamask/multichain-network-controller';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { MetaMetricsControllerGetStateAction } from '../../controllers/metametrics-controller';
import type {
  MetaMetricsControllerClearTracesAfterMetricsOptInAction,
  MetaMetricsControllerSetMarketingCampaignCookieIdAction,
  MetaMetricsControllerTrackTracesAfterMetricsOptInAction,
  MetaMetricsControllerUpdateExtensionUninstallUrlAction,
} from '../../controllers/metametrics-controller-method-action-types';
import type { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import type { RootMessenger } from '../../lib/messenger';

type InitActions =
  | PreferencesControllerGetStateAction
  | MultichainNetworkControllerGetStateAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction
  | MetaMetricsControllerGetStateAction
  | MetaMetricsControllerTrackTracesAfterMetricsOptInAction
  | MetaMetricsControllerClearTracesAfterMetricsOptInAction
  | MetaMetricsControllerSetMarketingCampaignCookieIdAction
  | MetaMetricsControllerUpdateExtensionUninstallUrlAction
  | AnalyticsControllerGetStateAction
  | AnalyticsControllerTrackEventAction
  | AnalyticsControllerIdentifyAction
  | AnalyticsControllerTrackViewAction
  | AnalyticsControllerOptInAction
  | AnalyticsControllerOptOutAction
  | AnalyticsControllerResetConsentDecisionAction;

type InitEvents = never;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * analytics controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAnalyticsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AnalyticsControllerMessenger>,
    MessengerEvents<AnalyticsControllerMessenger>
  >,
) {
  const analyticsControllerMessenger: AnalyticsControllerMessenger =
    new Messenger({
      namespace: 'AnalyticsController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: analyticsControllerMessenger,
    actions: ['GeolocationController:getGeolocationData'],
    events: [],
  });
  return analyticsControllerMessenger;
}

export type AnalyticsControllerInitMessenger = ReturnType<
  typeof getAnalyticsControllerInitMessenger
>;

/**
 * Create a messenger restricted to analytics initialization dependencies.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAnalyticsControllerInitMessenger(
  messenger: RootMessenger<InitActions, InitEvents>,
) {
  const analyticsControllerInitMessenger = new Messenger<
    'AnalyticsControllerInit',
    InitActions,
    InitEvents,
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
      'MetaMetricsController:getState',
      'MetaMetricsController:trackTracesAfterMetricsOptIn',
      'MetaMetricsController:clearTracesAfterMetricsOptIn',
      'MetaMetricsController:setMarketingCampaignCookieId',
      'MetaMetricsController:updateExtensionUninstallUrl',
      'AnalyticsController:getState',
      'AnalyticsController:trackEvent',
      'AnalyticsController:identify',
      'AnalyticsController:trackView',
      'AnalyticsController:optIn',
      'AnalyticsController:optOut',
      'AnalyticsController:resetConsentDecision',
    ],
    events: [],
  });

  return analyticsControllerInitMessenger;
}
