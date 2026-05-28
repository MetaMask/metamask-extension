import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { NameControllerMessenger } from '@metamask/name-controller';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the name
 * controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getNameControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NameControllerMessenger>,
    MessengerEvents<NameControllerMessenger>
  >,
): NameControllerMessenger {
  const controllerMessenger: NameControllerMessenger = new Messenger({
    namespace: 'NameController',
    parent: messenger,
  });
  return controllerMessenger;
}

type AllowedInitializationActions = PreferencesControllerGetStateAction;

export type NameControllerInitMessenger = ReturnType<
  typeof getNameControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the name controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getNameControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'NameControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'NameControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['PreferencesController:getState'],
  });
  return controllerInitMessenger;
}
