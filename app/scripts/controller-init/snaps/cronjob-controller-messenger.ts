import { ControllerMessenger } from '@metamask/base-controller';
import {
  SnapInstalled,
  SnapUpdated,
  SnapDisabled,
  SnapEnabled,
  SnapUninstalled,
  HandleSnapRequest,
  GetAllSnaps,
} from '@metamask/snaps-controllers';
import { GetPermissions } from '@metamask/permission-controller';

type Actions = GetPermissions | HandleSnapRequest | GetAllSnaps;

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
 * Get a restricted controller messenger for the cronjob controller. This is
 * scoped to the actions and events that the cronjob controller is allowed to
 * handle.
 *
 * @param controllerMessenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getCronjobControllerMessenger(
  controllerMessenger: ControllerMessenger<Actions, Events>,
) {
  return controllerMessenger.getRestricted({
    name: 'CronjobController',
    allowedEvents: [
      'SnapController:snapInstalled',
      'SnapController:snapUpdated',
      'SnapController:snapUninstalled',
      'SnapController:snapEnabled',
      'SnapController:snapDisabled',
    ],
    allowedActions: [
      `PermissionController:getPermissions`,
      'SnapController:handleRequest',
      'SnapController:getAll',
    ],
  });
}
