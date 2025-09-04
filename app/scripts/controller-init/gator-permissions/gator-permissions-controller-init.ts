import {
  GatorPermissionsController,
  GatorPermissionsControllerState,
} from '@metamask/gator-permissions-controller';
import { SnapId } from '@metamask/snaps-sdk';
import { ControllerInitFunction } from '../types';
import { isProduction } from '../../../../shared/modules/environment';
import { GatorPermissionsControllerMessenger } from '../messengers/gator-permissions';

export const LOCAL_GATOR_PERMISSIONS_PROVIDER_SNAP_ID =
  'local:http://localhost:8082' as SnapId;

const generateDefaultGatorPermissionsControllerState =
  (): Partial<GatorPermissionsControllerState> => {
    if (!isProduction()) {
      return {
        isGatorPermissionsEnabled: false,
        isFetchingGatorPermissions: false,
        gatorPermissionsProviderSnapId:
          LOCAL_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
      };
    }

    return {
      isGatorPermissionsEnabled: false,
      isFetchingGatorPermissions: false,
    };
  };

export const GatorPermissionsControllerInit: ControllerInitFunction<
  GatorPermissionsController,
  GatorPermissionsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new GatorPermissionsController({
    // Type mismatch due to different BaseController versions, GatorPermissionsController uses 8.3.0 while extension uses 8.2.0.
    // We can remove once extension BaseController version is updated to 8.3.0.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messenger: controllerMessenger as any,
    state: {
      ...generateDefaultGatorPermissionsControllerState(),
      ...persistedState.GatorPermissionsController,
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
