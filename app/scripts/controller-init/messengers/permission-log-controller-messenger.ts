import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

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
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<
    'PermissionLogController',
    never,
    never,
    typeof messenger
  >({
    namespace: 'PermissionLogController',
    parent: messenger,
  });
}
