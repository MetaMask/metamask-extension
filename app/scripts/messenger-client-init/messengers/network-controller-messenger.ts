import { ControllerStateChangeEvent } from '@metamask/base-controller';
import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import {
  NetworkControllerMessenger,
  NetworkControllerRpcEndpointDegradedEvent,
  NetworkControllerRpcEndpointUnavailableEvent,
} from '@metamask/network-controller';
import {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerState,
} from '@metamask/remote-feature-flag-controller';
import type { AnalyticsControllerGetStateAction } from '@metamask/analytics-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller-method-action-types';
import { RootMessenger } from '../../lib/messenger';

/**
 * Get a messenger restricted to actions the NetworkController needs.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getNetworkControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NetworkControllerMessenger>,
    MessengerEvents<NetworkControllerMessenger>
  >,
): NetworkControllerMessenger {
  const controllerMessenger: NetworkControllerMessenger = new Messenger({
    namespace: 'NetworkController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'ConnectivityController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    events: ['RemoteFeatureFlagController:stateChange'],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | AnalyticsControllerGetStateAction
  | MetaMetricsControllerTrackEventAction
  | RemoteFeatureFlagControllerGetStateAction;

type AllowedInitializationEvents =
  | NetworkControllerRpcEndpointUnavailableEvent
  | NetworkControllerRpcEndpointDegradedEvent
  | ControllerStateChangeEvent<
      'RemoteFeatureFlagController',
      RemoteFeatureFlagControllerState
    >;

export type NetworkControllerInitMessenger = ReturnType<
  typeof getNetworkControllerInitMessenger
>;

/**
 * Get a messenger restricted to actions the NetworkController needs during
 * initialization.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getNetworkControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'NetworkControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'NetworkControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'AnalyticsController:getState',
      'MetaMetricsController:trackEvent',
    ],
    events: [
      'NetworkController:rpcEndpointUnavailable',
      'NetworkController:rpcEndpointDegraded',
    ],
  });
  return controllerInitMessenger;
}
