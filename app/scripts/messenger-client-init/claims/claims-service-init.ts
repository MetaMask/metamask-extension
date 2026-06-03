import {
  ClaimsService,
  ClaimsServiceMessenger,
} from '@metamask/claims-controller';
import { MessengerClientInitFunction } from '../types';
import { loadShieldConfig } from '../../../../shared/lib/shield/config';

export const ClaimsServiceInit: MessengerClientInitFunction<
  ClaimsService,
  ClaimsServiceMessenger
> = (request) => {
  const { controllerMessenger } = request;

  const { claimsEnv } = loadShieldConfig();

  const messengerClient = new ClaimsService({
    messenger: controllerMessenger,
    env: claimsEnv,
    fetchFunction: fetch.bind(globalThis),
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
