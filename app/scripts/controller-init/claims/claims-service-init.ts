import { ClaimsService } from '@metamask/claims-controller';
import { Env } from '@metamask/profile-sync-controller/sdk';
import { ControllerInitFunction } from '../types';
import { ClaimsServiceMessengerType } from '../messengers/claims/claims-service-messenger';

export const ClaimsServiceInit: ControllerInitFunction<
  ClaimsService,
  ClaimsServiceMessengerType
> = (request) => {
  const { controllerMessenger } = request;

  const service = new ClaimsService({
    messenger: controllerMessenger,
    env: Env.DEV,
    fetchFunction: fetch.bind(globalThis),
  });

  return {
    controller: service,
    memStateKey: null,
    persistedStateKey: null,
  };
};
