import { Messenger } from '@metamask/messenger';
import {
  RemoteFeatureFlagControllerGetStateAction,
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
