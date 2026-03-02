import {
  GatorPermissionsController,
  type GatorPermissionsControllerConfig,
} from '@metamask/gator-permissions-controller';
import { assertIsValidSnapId } from '@metamask/snaps-utils';
import { ControllerInitFunction } from '../types';
import { getEnabledAdvancedPermissions } from '../../../../shared/modules/environment';
import { GatorPermissionsControllerMessenger } from '../messengers/gator-permissions';

const createGatorPermissionsConfig = (): GatorPermissionsControllerConfig => {
  const gatorPermissionsProviderSnapId =
    process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;

  // if GATOR_PERMISSIONS_PROVIDER_SNAP_ID is not specified, GatorPermissionsController will initialize it's default
  if (gatorPermissionsProviderSnapId !== undefined) {
    try {
      assertIsValidSnapId(gatorPermissionsProviderSnapId);
    } catch (error) {
      throw new Error(
        'GATOR_PERMISSIONS_PROVIDER_SNAP_ID must be set to a valid snap id',
        {
          cause: error,
        },
      );
    }
  }

  const supportedPermissionTypes = getEnabledAdvancedPermissions();

  const config: GatorPermissionsControllerConfig = {
    supportedPermissionTypes,
  };

  if (gatorPermissionsProviderSnapId) {
    config.gatorPermissionsProviderSnapId = gatorPermissionsProviderSnapId;
  }

  return config;
};

export const GatorPermissionsControllerInit: ControllerInitFunction<
  GatorPermissionsController,
  GatorPermissionsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new GatorPermissionsController({
    messenger: controllerMessenger,
    config: createGatorPermissionsConfig(),
    state: persistedState.GatorPermissionsController,
  });

  return {
    controller,
    api: {
      fetchAndUpdateGatorPermissions:
        controller.fetchAndUpdateGatorPermissions.bind(controller),
      addPendingRevocation: controller.addPendingRevocation.bind(controller),
      submitDirectRevocation:
        controller.submitDirectRevocation.bind(controller),
    },
  };
};
