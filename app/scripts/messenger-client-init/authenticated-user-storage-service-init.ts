import {
  AuthenticatedUserStorageService,
  type AuthenticatedUserStorageMessenger,
  type Environment,
} from '@metamask/authenticated-user-storage';
import { Env } from '@metamask/profile-sync-controller/sdk';
import { loadAuthenticationConfig } from '../../../shared/lib/authentication/config';
import { MessengerClientInitFunction } from './types';

/**
 * The environment MUST match AuthenticationController: a PRD-issued JWT cannot
 * be validated against DEV user-storage APIs and vice versa. Both read
 * `loadAuthenticationConfig()` so they always agree.
 *
 * @returns Authenticated User Storage environment
 */
export function getAuthenticatedUserStorageEnvironment(): Environment {
  const authEnvironment = loadAuthenticationConfig();

  if (authEnvironment === Env.DEV) {
    return 'dev';
  }

  if (authEnvironment === Env.UAT) {
    return 'uat';
  }

  return 'prod';
}

export const AuthenticatedUserStorageServiceInit: MessengerClientInitFunction<
  AuthenticatedUserStorageService,
  AuthenticatedUserStorageMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new AuthenticatedUserStorageService({
    messenger: controllerMessenger,
    environment: getAuthenticatedUserStorageEnvironment(),
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
