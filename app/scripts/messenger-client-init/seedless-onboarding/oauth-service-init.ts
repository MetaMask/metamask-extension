import { MessengerClientInitFunction } from '../types';
import { OAuthService } from '../../services/oauth/oauth-service';
import { webAuthenticatorFactory } from '../../services/oauth/web-authenticator-factory';
import { OAuthServiceMessenger } from '../../services/oauth/types';
import ExtensionPlatform from '../../platforms/extension';
import { trackEvent } from '../../controllers/analytics/analytics';

export const OAuthServiceInit: MessengerClientInitFunction<
  OAuthService,
  OAuthServiceMessenger
> = (request) => {
  const { controllerMessenger } = request;

  const messengerClient = new OAuthService({
    messenger: controllerMessenger,
    webAuthenticator: webAuthenticatorFactory(),
    platform: new ExtensionPlatform(),

    trackEvent,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
