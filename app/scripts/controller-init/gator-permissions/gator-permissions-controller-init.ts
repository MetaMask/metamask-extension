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
    const snapId = process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;
    const baseGatorPermissionsControllerState: Partial<GatorPermissionsControllerState> =
      {
        isGatorPermissionsEnabled: isGatorPermissionsFeatureEnabled(),
      };

    try {
      assertIsValidSnapId(snapId);
    } catch (error) {
      return baseGatorPermissionsControllerState;
    }

    return {
      ...baseGatorPermissionsControllerState,
      gatorPermissionsProviderSnapId: snapId,
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
      fetchAndUpdateGatorPermissions:
        controller.fetchAndUpdateGatorPermissions.bind(controller),
    },
  };
};
