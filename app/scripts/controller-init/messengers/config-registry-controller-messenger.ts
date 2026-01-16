import { Messenger } from '@metamask/messenger';
import {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerStateChangeEvent,
} from '@metamask/remote-feature-flag-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions = RemoteFeatureFlagControllerGetStateAction;

export type ConfigRegistryControllerMessenger = ReturnType<
  typeof getConfigRegistryControllerMessenger
>;

/**
 * Get a restricted messenger for the Config Registry controller. This is scoped to the
 * actions and events that the Config Registry controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getConfigRegistryControllerMessenger(
  messenger: RootMessenger<AllowedActions, never>,
) {
  const controllerMessenger = new Messenger<
    'ConfigRegistryController',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'ConfigRegistryController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['RemoteFeatureFlagController:getState'],
  });
  return controllerMessenger;
}

type AllowedInitializationActions = RemoteFeatureFlagControllerGetStateAction;

type AllowedInitializationEvents = RemoteFeatureFlagControllerStateChangeEvent;

export type ConfigRegistryControllerInitMessenger = ReturnType<
  typeof getConfigRegistryControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the Config Registry controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getConfigRegistryControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'ConfigRegistryControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'ConfigRegistryControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['RemoteFeatureFlagController:getState'],
    events: ['RemoteFeatureFlagController:stateChange'],
  });
  return controllerInitMessenger;
}
