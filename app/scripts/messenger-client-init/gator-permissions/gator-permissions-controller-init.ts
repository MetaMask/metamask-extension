import {
  GatorPermissionsController,
  type GatorPermissionsControllerMessenger,
  type GatorPermissionsControllerConfig,
} from '@metamask/gator-permissions-controller';
import { assertIsValidSnapId } from '@metamask/snaps-utils';
import { MessengerClientInitFunction } from '../types';
import { getEnabledAdvancedPermissions } from '../../../../shared/lib/gator-permissions/feature-flags';

const createGatorPermissionsConfig = (
  remoteFeatureFlagControllerState: Parameters<
    typeof getEnabledAdvancedPermissions
  >[0],
): GatorPermissionsControllerConfig => {
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

  const supportedPermissionTypes = getEnabledAdvancedPermissions(
    remoteFeatureFlagControllerState,
  );

  const config: GatorPermissionsControllerConfig = {
    supportedPermissionTypes,
  };

  if (gatorPermissionsProviderSnapId) {
    config.gatorPermissionsProviderSnapId = gatorPermissionsProviderSnapId;
  }

  return config;
};

export const GatorPermissionsControllerInit: MessengerClientInitFunction<
  GatorPermissionsController,
  GatorPermissionsControllerMessenger
> = ({ controllerMessenger, getMessengerClient, persistedState }) => {
  const remoteFeatureFlagController = getMessengerClient(
    'RemoteFeatureFlagController',
  );

  const messengerClient = new GatorPermissionsController({
    messenger: controllerMessenger,
    config: createGatorPermissionsConfig(remoteFeatureFlagController.state),
    state: persistedState.GatorPermissionsController,
  });

  return {
    messengerClient,
    api: {
      fetchAndUpdateGatorPermissions:
        messengerClient.fetchAndUpdateGatorPermissions.bind(messengerClient),
      addPendingRevocation:
        messengerClient.addPendingRevocation.bind(messengerClient),
      submitDirectRevocation:
        messengerClient.submitDirectRevocation.bind(messengerClient),
    },
  };
};
