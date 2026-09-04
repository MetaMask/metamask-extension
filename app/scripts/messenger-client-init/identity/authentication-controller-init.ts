import {
  AuthenticationControllerState,
  Controller as AuthenticationController,
} from '@metamask/profile-sync-controller/auth';
import { Platform } from '@metamask/profile-sync-controller/sdk';
import { MessengerClientInitFunction } from '../types';
import {
  AuthenticationControllerInitMessenger,
  AuthenticationControllerMessenger,
} from '../messengers/identity';
import {
  loadAuthenticationConfig,
  sanitizePersistedAuthenticationState,
} from '../../../../shared/lib/authentication';

/**
 * Initialize the Authentication controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger - The messenger to use for initialization.
 * @returns The initialized controller.
 */
export const AuthenticationControllerInit: MessengerClientInitFunction<
  AuthenticationController,
  AuthenticationControllerMessenger,
  AuthenticationControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const env = loadAuthenticationConfig();
  const messengerClient = new AuthenticationController({
    messenger: controllerMessenger,
    state: sanitizePersistedAuthenticationState(
      persistedState.AuthenticationController as
        | AuthenticationControllerState
        | undefined,
      env,
    ),
    metametrics: {
      getMetaMetricsId: () =>
        initMessenger.call('AnalyticsController:getState').analyticsId,
      agent: Platform.EXTENSION,
      getAppVersion: () => process.env.METAMASK_VERSION,
    },
    config: {
      env,
    },
  });

  return {
    messengerClient,
  };
};
