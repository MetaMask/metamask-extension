import { PermissionLogController } from '@metamask/permission-log-controller';
import { RestrictedMethods } from '../../../shared/constants/permissions';
import { PermissionLogControllerMessenger } from './messengers';
import { ControllerInitFunction } from './types';

/**
 * Initialize the permission log controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const PermissionLogControllerInit: ControllerInitFunction<
  PermissionLogController,
  PermissionLogControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new PermissionLogController({
    messenger: controllerMessenger,
    state: persistedState.PermissionLogController,
    restrictedMethods: new Set(Object.keys(RestrictedMethods)),
  });

  return {
    controller,
  };
};
