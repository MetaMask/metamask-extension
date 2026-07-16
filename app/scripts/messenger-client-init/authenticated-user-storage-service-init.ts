import {
  AuthenticatedUserStorageService,
  type AuthenticatedUserStorageMessenger,
} from '@metamask/authenticated-user-storage';
import { Env } from '@metamask/profile-sync-controller/sdk';
import { loadAuthenticationConfig } from '../../../shared/lib/authentication/config';
import { MessengerClientInitFunction } from './types';

const getAuthenticatedUserStorageEnvironment = (): 'uat' | 'prod' => {
  const authEnvironment = loadAuthenticationConfig();

  if (authEnvironment === Env.UAT) {
    return 'uat';
  }

  return 'prod';
};

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
