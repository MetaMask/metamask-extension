import {
  UserStorageControllerMessenger,
  UserStorageControllerState,
  Controller as UserStorageController,
} from '@metamask/profile-sync-controller/user-storage';
import { ControllerInitFunction } from '../types';
import { isProduction } from '../../../../shared/modules/environment';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { trace } from '../../../../shared/lib/trace';
import { captureException } from '../../../../shared/lib/sentry';

/**
 * Initialize the UserStorage controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const UserStorageControllerInit: ControllerInitFunction<
  UserStorageController,
  UserStorageControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState, trackEvent } = request;
  const controller = new UserStorageController({
    messenger: controllerMessenger,
    state: persistedState.UserStorageController as UserStorageControllerState,
    // @ts-expect-error Controller uses string for names rather than enum
    trace,
    config: {
      contactSyncing: {
        onContactUpdated: (profileId) => {
          trackEvent({
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.ProfileActivityUpdated,
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              profile_id: profileId,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              feature_name: 'Backup And Sync',
              action: 'Contacts Sync Contact Updated',
            },
          });
        },
        onContactDeleted: (profileId) => {
          trackEvent({
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.ProfileActivityUpdated,
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              profile_id: profileId,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              feature_name: 'Backup And Sync',
              action: 'Contacts Sync Contact Deleted',
            },
          });
        },
        onContactSyncErroneousSituation: (
          profileId,
          situationMessage,
          sentryContext,
        ) => {
          captureException(
            new Error(`Contact sync - ${situationMessage}`),
            sentryContext,
          );
          trackEvent({
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.ProfileActivityUpdated,
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              profile_id: profileId,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              feature_name: 'Backup And Sync',
              action: 'Contacts Sync Erroneous Situation',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              additional_description: situationMessage,
            },
          });
        },
      },
    },
  });

  return {
    controller,
  };
};
