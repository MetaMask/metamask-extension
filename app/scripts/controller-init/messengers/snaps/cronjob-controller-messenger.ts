import { Messenger } from '@metamask/messenger';
import {
  SnapInstalled,
  SnapUpdated,
  SnapDisabled,
  SnapEnabled,
  SnapUninstalled,
  HandleSnapRequest,
} from '@metamask/snaps-controllers';
import { GetPermissions } from '@metamask/permission-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions = GetPermissions | HandleSnapRequest;

type Events =
  | SnapInstalled
  | SnapUpdated
  | SnapUninstalled
  | SnapEnabled
  | SnapDisabled;

export type CronjobControllerMessenger = ReturnType<
  typeof getCronjobControllerMessenger
>;

/**
 * Get a restricted messenger for the cronjob controller. This is scoped to the
 * actions and events that the cronjob controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getCronjobControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'CronjobController',
    Actions,
    Events,
    typeof messenger
  >({
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
