import { MessengerClientInitFunction } from '../types';
import { OAuthService } from '../../services/oauth/oauth-service';
import { webAuthenticatorFactory } from '../../services/oauth/web-authenticator-factory';
import { OAuthServiceMessenger } from '../../services/oauth/types';
import { MetaMetricsController } from '../../controllers/metametrics-controller';
import ExtensionPlatform from '../../platforms/extension';
import { trackEvent } from '../../controllers/analytics/analytics';

export const OAuthServiceInit: MessengerClientInitFunction<
  OAuthService,
  OAuthServiceMessenger
> = (request) => {
  const { controllerMessenger, getMessengerClient } = request;

  const metaMetricsController = getMessengerClient(
    'MetaMetricsController',
  ) as MetaMetricsController;

  const messengerClient = new OAuthService({
    messenger: controllerMessenger,
    webAuthenticator: webAuthenticatorFactory(),
    platform: new ExtensionPlatform(),

    bufferedTrace: metaMetricsController.bufferedTrace.bind(
      metaMetricsController,
    ),

    bufferedEndTrace: metaMetricsController.bufferedEndTrace.bind(
      metaMetricsController,
    ),

    trackEvent,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
