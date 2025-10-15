import {
  UserStorageControllerMessenger,
  UserStorageControllerState,
  Controller as UserStorageController,
} from '@metamask/profile-sync-controller/user-storage';
import { Env } from '@metamask/profile-sync-controller/sdk';
import { ControllerInitFunction } from '../types';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { trace } from '../../../../shared/lib/trace';
import { captureException } from '../../../../shared/lib/sentry';
import { UserStorageControllerInitMessenger } from '../messengers/identity/user-storage-controller-messenger';
import { ENVIRONMENT } from '../../../../development/build/constants';

/**
 * Check if the build is a Development or Test build.
 *
 * @returns true if the build is a Development or Test build, false otherwise
 */
function isDevOrTestBuild() {
  return (
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT ||
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.TESTING
  );
}

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
  UserStorageControllerMessenger,
  UserStorageControllerInitMessenger
> = (request) => {
  const { controllerMessenger, initMessenger, persistedState } = request;
  const controller = new UserStorageController({
    messenger: controllerMessenger,
    state: persistedState.UserStorageController as UserStorageControllerState,
    // @ts-expect-error Controller uses string for names rather than enum
    trace,
    config: {
      env: isDevOrTestBuild() ? Env.DEV : Env.PRD,
      contactSyncing: {
        onContactUpdated: (profileId) => {
          initMessenger.call('MetaMetricsController:trackEvent', {
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
          initMessenger.call('MetaMetricsController:trackEvent', {
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
          initMessenger.call('MetaMetricsController:trackEvent', {
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
