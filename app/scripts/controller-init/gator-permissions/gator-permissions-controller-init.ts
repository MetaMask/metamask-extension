import {
  GatorPermissionsController,
  type GatorPermissionsControllerConfig,
} from '@metamask/gator-permissions-controller';
import { ControllerInitFunction } from '../types';
import { type GatorPermissionsControllerMessenger } from '../messengers/gator-permissions';

export const GatorPermissionsControllerInit: ControllerInitFunction<
  GatorPermissionsController,
  GatorPermissionsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new GatorPermissionsController({
    messenger: controllerMessenger,
    state: persistedState.GatorPermissionsController,
    config: {
      gatorPermissionsProviderSnapId: 'local:http://localhost:8082',
    } as GatorPermissionsControllerConfig,
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
