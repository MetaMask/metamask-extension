import { Messenger } from '@metamask/base-controller';

export type PermissionLogControllerMessenger = ReturnType<
  typeof getPermissionLogControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * permission log controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getPermissionLogControllerMessenger(
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'PermissionLogController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
