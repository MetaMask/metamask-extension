import {
  GatorPermissionsController,
  GatorPermissionsControllerState,
} from '@metamask/gator-permissions-controller';
import { assertIsValidSnapId } from '@metamask/snaps-utils';
import { ControllerInitFunction } from '../types';
import { isGatorPermissionsFeatureEnabled } from '../../../../shared/modules/environment';
import { GatorPermissionsControllerMessenger } from '../messengers/gator-permissions';

const generateDefaultGatorPermissionsControllerState =
  (): Partial<GatorPermissionsControllerState> => {
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

    const isGatorPermissionsEnabled = isGatorPermissionsFeatureEnabled();

    const state: Partial<GatorPermissionsControllerState> = {
      isGatorPermissionsEnabled,
    };

    if (gatorPermissionsProviderSnapId) {
      state.gatorPermissionsProviderSnapId = gatorPermissionsProviderSnapId;
    }

    return state;
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
      fetchAndUpdateGatorPermissions:
        controller.fetchAndUpdateGatorPermissions.bind(controller),
    },
  };
};
