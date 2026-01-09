import { ControllerStateChangeEvent } from '@metamask/base-controller';
import { Messenger, MessengerActions } from '@metamask/messenger';
import {
  NetworkControllerRpcEndpointDegradedEvent,
  NetworkControllerRpcEndpointUnavailableEvent,
  NetworkControllerMessenger as NetworkControllerMessengerType,
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

// Allow ErrorReportingService actions and NetworkController's own namespace actions
// Using ActionConstraint allows the controller to register handlers for its own actions
type AllowedActions = MessengerActions<NetworkControllerMessengerType>;

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
  messenger: RootMessenger<AllowedActions, never>,
) {
  const controllerMessenger = new Messenger<
    'NetworkController',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'NetworkController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['ErrorReportingService:captureException'],
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
