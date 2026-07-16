import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type {
  AnalyticsControllerMessenger,
  AnalyticsControllerGetStateAction,
  AnalyticsControllerIdentifyAction,
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
import type { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import type { AppStateControllerGetStateAction } from '../../controllers/app-state-controller';
import type { RootMessenger } from '../../lib/messenger';

type InitActions =
  | PreferencesControllerGetStateAction
  | MultichainNetworkControllerGetStateAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction
  | MetaMetricsControllerGetStateAction
  | AnalyticsControllerGetStateAction
  | AnalyticsControllerTrackEventAction
  | AnalyticsControllerIdentifyAction
  | AnalyticsControllerTrackViewAction
  | AppStateControllerGetStateAction;

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
    actions: [],
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
      'AnalyticsController:getState',
      'AnalyticsController:trackEvent',
      'AnalyticsController:identify',
      'AnalyticsController:trackView',
      'AppStateController:getState',
    ],
    events: [],
  });

  return analyticsControllerInitMessenger;
}
