import {
  GatorPermissionsController,
  type GatorPermissionsControllerMessenger,
} from '@metamask/gator-permissions-controller';
import { SnapId } from '@metamask/snaps-sdk';
import { ControllerInitFunction } from '../types';
import { GatorPermissionsControllerInitMessenger } from '../messengers/gator-permissions';

export const GatorPermissionsControllerInit: ControllerInitFunction<
  GatorPermissionsController,
  // @ts-expect-error - GatorPermissionsControllerMessenger is not a valid type
  GatorPermissionsControllerMessenger,
  GatorPermissionsControllerInitMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new GatorPermissionsController({
    messenger: controllerMessenger,
    state: {
      ...persistedState.GatorPermissionsController,
      gatorPermissionsProviderSnapId: 'local:http://localhost:8082' as SnapId,
    },
  });

  return {
    controller,
    api: {
      enableGatorPermissions:
        controller.enableGatorPermissions.bind(controller),
      disableGatorPermissions:
        controller.disableGatorPermissions.bind(controller),
      fetchAndUpdateGatorPermissions:
        controller.fetchAndUpdateGatorPermissions.bind(controller),
    },
  };
};
