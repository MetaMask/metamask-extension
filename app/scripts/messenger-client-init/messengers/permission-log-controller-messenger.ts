import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { PermissionLogControllerMessenger } from '@metamask/permission-log-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * permission log controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getPermissionLogControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<PermissionLogControllerMessenger>,
    MessengerEvents<PermissionLogControllerMessenger>
  >,
): PermissionLogControllerMessenger {
  const controllerMessenger: PermissionLogControllerMessenger = new Messenger({
    namespace: 'PermissionLogController',
    parent: messenger,
  });
  return controllerMessenger;
}
