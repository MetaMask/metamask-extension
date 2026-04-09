import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { CronjobControllerMessenger } from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the cronjob controller. This is scoped to the
 * actions and events that the cronjob controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getCronjobControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<CronjobControllerMessenger>,
    MessengerEvents<CronjobControllerMessenger>
  >,
) {
  const controllerMessenger: CronjobControllerMessenger = new Messenger({
    namespace: 'CronjobController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'SnapController:snapInstalled',
      'SnapController:snapUpdated',
      'SnapController:snapUninstalled',
      'SnapController:snapEnabled',
      'SnapController:snapDisabled',
    ],
    actions: [
      'PermissionController:getPermissions',
      'SnapController:handleRequest',
    ],
  });
  return controllerMessenger;
}
