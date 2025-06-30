import { ControllerInitFunction } from '../types';
import { type GatorPermissionsControllerMessenger } from '../messengers/gator-permissions';
import { GatorPermissionsController } from '@metamask/gator-permissions-controller';

export const GatorPermissionsControllerInit: ControllerInitFunction<
  GatorPermissionsController,
  GatorPermissionsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new GatorPermissionsController({
    messenger: controllerMessenger,
    state: persistedState.GatorPermissionsController,
  });

  return {
    controller,
    api: {
      enableGatorPermissions: controller.enableGatorPermissions.bind(controller),
      disableGatorPermissions: controller.disableGatorPermissions.bind(controller),
      fetchAndUpdateGatorPermissions: controller.fetchAndUpdateGatorPermissions.bind(controller),
    },
  };
};
