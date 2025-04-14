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
            category: MetaMetricsEventCategory.ProfileSyncing,
            event: MetaMetricsEventName.AccountsSyncAdded,
            properties: {
              // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              profile_id: profileId,
            },
          });
        },
        onAccountNameUpdated: (profileId) => {
          trackEvent({
            category: MetaMetricsEventCategory.ProfileSyncing,
            event: MetaMetricsEventName.AccountsSyncNameUpdated,
            properties: {
              // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
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
            category: MetaMetricsEventCategory.ProfileSyncing,
            event: MetaMetricsEventName.AccountsSyncErroneousSituation,
            properties: {
              // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              profile_id: profileId,
              // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              situation_message: situationMessage,
            },
          });
        },
      },
    },
    env: {
      isAccountSyncingEnabled: true,
    },
  });

  return {
    controller,
  };
};
