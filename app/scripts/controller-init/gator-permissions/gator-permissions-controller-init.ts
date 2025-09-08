import {
  GatorPermissionsController,
  GatorPermissionsControllerState,
} from '@metamask/gator-permissions-controller';
import { SnapId } from '@metamask/snaps-sdk';
import { assertIsValidSnapId } from '@metamask/snaps-utils';
import { ControllerInitFunction } from '../types';
import { isGatorPermissionsFeatureEnabled } from '../../../../shared/modules/environment';
import { GatorPermissionsControllerMessenger } from '../messengers/gator-permissions';

const generateDefaultGatorPermissionsControllerState =
  (): Partial<GatorPermissionsControllerState> => {
    const snapId = process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;
    let validSnapId: SnapId | undefined;

    try {
      assertIsValidSnapId(snapId);
      validSnapId = snapId;
    } catch (error) {
      validSnapId = undefined;
    }

    return {
      isGatorPermissionsEnabled: isGatorPermissionsFeatureEnabled(),
      gatorPermissionsProviderSnapId: validSnapId,
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
