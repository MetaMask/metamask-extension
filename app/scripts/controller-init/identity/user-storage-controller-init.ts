import {
  UserStorageControllerMessenger,
  UserStorageControllerState,
  Controller as UserStorageController,
} from '@metamask/profile-sync-controller/user-storage';
import { captureException } from '@sentry/browser';
import { ControllerInitFunction } from '../types';
import { isProduction } from '../../../../shared/modules/environment';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

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
    config: {
      accountSyncing: {
        maxNumberOfAccountsToAdd: isProduction() ? undefined : 100,
        onAccountAdded: (profileId) => {
          trackEvent({
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.AccountsSyncAdded,
            properties: {
              profile_id: profileId,
            },
          });
        },
        onAccountNameUpdated: (profileId) => {
          trackEvent({
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.AccountsSyncNameUpdated,
            properties: {
              profile_id: profileId,
            },
          });
        },
        onAccountSyncErroneousSituation: (
          profileId,
          situationMessage,
          sentryContext,
        ) => {
          captureException(
            new Error(`Account sync - ${situationMessage}`),
            sentryContext,
          );
          trackEvent({
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.AccountsSyncErroneousSituation,
            properties: {
              profile_id: profileId,
              situation_message: situationMessage,
            },
          });
        },
      },
      contactSyncing: {
        onContactUpdated: (profileId) => {
          trackEvent({
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.ProfileActivityUpdated,
            properties: {
              profile_id: profileId,
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
              profile_id: profileId,
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
              profile_id: profileId,
              feature_name: 'Backup And Sync',
              action: 'Contacts Sync Erroneous Situation',
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
