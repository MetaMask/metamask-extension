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
import {
  MetaMetricsControllerGetMetaMetricsIdAction,
  MetaMetricsControllerTrackEventAction,
} from '../../controllers/metametrics-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Get a messenger restricted to actions the NetworkController needs.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getNetworkControllerMessenger(
  messenger: RootMessenger,
): NetworkControllerMessenger {
  const controllerMessenger = new Messenger<
    'NetworkController',
    MessengerActions<NetworkControllerMessenger>,
    MessengerEvents<NetworkControllerMessenger>,
    RootMessenger
  >({
    namespace: 'NetworkController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['ConnectivityController:getState'],
    events: [],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | MetaMetricsControllerGetMetaMetricsIdAction
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
      'MetaMetricsController:getMetaMetricsId',
      'MetaMetricsController:trackEvent',
      'RemoteFeatureFlagController:getState',
    ],
    events: [
      'NetworkController:rpcEndpointUnavailable',
      'NetworkController:rpcEndpointDegraded',
      'RemoteFeatureFlagController:stateChange',
    ],
  });
  return controllerInitMessenger;
}
