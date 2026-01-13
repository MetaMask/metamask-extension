import { ControllerStateChangeEvent } from '@metamask/base-controller';
import { Messenger } from '@metamask/messenger';
import {
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
import { ConnectivityControllerGetStateAction } from '../../controllers/connectivity';
import { RootMessenger } from '../../lib/messenger';

export type NetworkControllerMessenger = ReturnType<
  typeof getNetworkControllerMessenger
>;

/**
 * Get a messenger restricted to actions the NetworkController needs.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getNetworkControllerMessenger(
  messenger: RootMessenger<never, never>,
) {
  const controllerMessenger = new Messenger<
    'NetworkController',
    never,
    never,
    typeof messenger
  >({
    namespace: 'NetworkController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | ConnectivityControllerGetStateAction
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
      'ConnectivityController:getState',
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
