import { ClaimsService } from '@metamask/claims-controller';
import { MessengerClientInitFunction } from '../types';
import { ClaimsServiceMessengerType } from '../messengers/claims/claims-service-messenger';
import { loadShieldConfig } from '../../../../shared/lib/shield/config';

export const ClaimsServiceInit: MessengerClientInitFunction<
  ClaimsService,
  ClaimsServiceMessengerType
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
