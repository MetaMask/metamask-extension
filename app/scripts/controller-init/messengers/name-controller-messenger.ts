import { Messenger } from '@metamask/base-controller';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';

export type NameControllerMessenger = ReturnType<
  typeof getNameControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the name
 * controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getNameControllerMessenger(messenger: Messenger<never, never>) {
  return messenger.getRestricted({
    name: 'NameController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
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
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'NameControllerInit',
    allowedActions: ['PreferencesController:getState'],
    allowedEvents: [],
  });
}
