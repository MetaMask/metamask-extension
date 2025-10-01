import { ControllerInitFunction } from '../types';
import { SubscriptionService } from '../../services/subscription/subscription-service';
import { SubscriptionServiceMessenger } from '../../services/subscription/types';
import { webAuthenticatorFactory } from '../../services/oauth/web-authenticator-factory';

export const SubscriptionServiceInit: ControllerInitFunction<
  SubscriptionService,
  SubscriptionServiceMessenger
> = (request) => {
  const { controllerMessenger, platform } = request;

  const service = new SubscriptionService({
    messenger: controllerMessenger,
    platform,
    webAuthenticator: webAuthenticatorFactory(),
  });

  return {
    controller: service,
    memStateKey: null,
    persistedStateKey: null,
  };
};
