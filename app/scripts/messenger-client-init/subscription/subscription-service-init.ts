import { MessengerClientInitFunction } from '../types';
import { SubscriptionService } from '../../services/subscription/subscription-service';
import { SubscriptionServiceMessenger } from '../../services/subscription/types';
import { webAuthenticatorFactory } from '../../services/oauth/web-authenticator-factory';

export const SubscriptionServiceInit: MessengerClientInitFunction<
  SubscriptionService,
  SubscriptionServiceMessenger
> = (request) => {
  const { controllerMessenger, platform } = request;

  const messengerClient = new SubscriptionService({
    messenger: controllerMessenger,
    platform,
    webAuthenticator: webAuthenticatorFactory(),
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
