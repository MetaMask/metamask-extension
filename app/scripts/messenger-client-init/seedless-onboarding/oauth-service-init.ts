import { MessengerClientInitFunction } from '../types';
import { OAuthService } from '../../services/oauth/oauth-service';
import { webAuthenticatorFactory } from '../../services/oauth/web-authenticator-factory';
import { OAuthServiceMessenger } from '../../services/oauth/types';
import { MetaMetricsController } from '../../controllers/metametrics-controller';

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
    env: {
      googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
      appleClientId: process.env.APPLE_CLIENT_ID ?? '',
    },
    webAuthenticator: webAuthenticatorFactory(),

    bufferedTrace: metaMetricsController.bufferedTrace.bind(
      metaMetricsController,
    ),

    bufferedEndTrace: metaMetricsController.bufferedEndTrace.bind(
      metaMetricsController,
    ),

    trackEvent: metaMetricsController.trackEvent.bind(metaMetricsController),

    addEventBeforeMetricsOptIn:
      metaMetricsController.addEventBeforeMetricsOptIn.bind(
        metaMetricsController,
      ),

    getParticipateInMetaMetrics: () =>
      metaMetricsController.state.participateInMetaMetrics,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
