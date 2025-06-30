import {
  UserStorageControllerMessenger,
  UserStorageControllerState,
  Controller as UserStorageController,
} from '@metamask/profile-sync-controller/user-storage';
import {
  MetaMetrics,
} from '@metamask/profile-sync-controller';
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
            properties: MetaMetrics.BackupAndSyncEventProperties.ACCOUNT_ADDED(profileId),
          });
        },
        onAccountNameUpdated: (profileId) => {
          trackEvent({
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.AccountsSyncNameUpdated,
            properties: MetaMetrics.BackupAndSyncEventProperties.ACCOUNT_NAME_UPDATED(profileId),
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
            properties: MetaMetrics.BackupAndSyncEventProperties.ACCOUNT_SYNC_ERROR(profileId, situationMessage),
          });
        },
      },
      contactSyncing: {
        onContactUpdated: (profileId) => {
          trackEvent({
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.ProfileActivityUpdated,
            properties: MetaMetrics.BackupAndSyncEventProperties.CONTACT_UPDATED(profileId),
          });
        },
        onContactDeleted: (profileId) => {
          trackEvent({
            category: MetaMetricsEventCategory.BackupAndSync,
            event: MetaMetricsEventName.ProfileActivityUpdated,
            properties: MetaMetrics.BackupAndSyncEventProperties.CONTACT_DELETED(profileId),
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
            properties: MetaMetrics.BackupAndSyncEventProperties.CONTACT_SYNC_ERROR(profileId, situationMessage),
          });
        },
      },
    },
  });

  return {
    controller,
  };
};
