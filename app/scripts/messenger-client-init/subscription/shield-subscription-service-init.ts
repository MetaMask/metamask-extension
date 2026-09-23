import { MessengerClientInitFunction } from '../types';
import { ShieldSubscriptionService } from '../../services/subscription/shield-subscription-service';
import { ShieldSubscriptionServiceMessenger } from '../../services/subscription/types';
import { webAuthenticatorFactory } from '../../services/oauth/web-authenticator-factory';

export const ShieldSubscriptionServiceInit: MessengerClientInitFunction<
  ShieldSubscriptionService,
  ShieldSubscriptionServiceMessenger
> = (request) => {
  const { controllerMessenger, platform } = request;

  const messengerClient = new ShieldSubscriptionService({
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
