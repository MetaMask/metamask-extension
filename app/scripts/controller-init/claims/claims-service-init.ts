import { ClaimsService } from '@metamask/claims-controller';
import { ControllerInitFunction } from '../types';
import { ClaimsServiceMessengerType } from '../messengers/claims/claims-service-messenger';
import { loadShieldConfig } from '../../../../shared/modules/shield/config';

export const ClaimsServiceInit: ControllerInitFunction<
  ClaimsService,
  ClaimsServiceMessengerType
> = (request) => {
  const { controllerMessenger } = request;

  const { claimsEnv } = loadShieldConfig();

  const service = new ClaimsService({
    messenger: controllerMessenger,
    env: claimsEnv,
    fetchFunction: fetch.bind(globalThis),
  });

  return {
    controller: service,
    memStateKey: null,
    persistedStateKey: null,
  };
};
