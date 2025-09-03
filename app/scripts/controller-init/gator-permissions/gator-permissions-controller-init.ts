import {
  GatorPermissionsController,
  type GatorPermissionsControllerMessenger,
} from '@metamask/gator-permissions-controller';
import { SnapId } from '@metamask/snaps-sdk';
import { ControllerInitFunction } from '../types';
import { GatorPermissionsControllerInitMessenger } from '../messengers/gator-permissions';
import { isProduction } from '../../../../shared/modules/environment';

export const LOCAL_GATOR_PERMISSIONS_PROVIDER_SNAP_ID =
  'local:http://localhost:8082' as SnapId;

export const GatorPermissionsControllerInit: ControllerInitFunction<
  GatorPermissionsController,
  GatorPermissionsControllerMessenger,
  GatorPermissionsControllerInitMessenger
> = ({ controllerMessenger, persistedState }) => {
  const configuredState = isProduction()
    ? persistedState.GatorPermissionsController
    : {
        ...persistedState.GatorPermissionsController,
        gatorPermissionsProviderSnapId:
          LOCAL_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
      };

  const controller = new GatorPermissionsController({
    messenger: controllerMessenger,
    state: configuredState,
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
