import { AnalyticsController } from '@metamask/analytics-controller';
import { MessengerClientInitFunction } from '../types';
import { OAuthService } from '../../services/oauth/oauth-service';
import { webAuthenticatorFactory } from '../../services/oauth/web-authenticator-factory';
import { OAuthServiceMessenger } from '../../services/oauth/types';
import { MetaMetricsController } from '../../controllers/metametrics-controller';
import ExtensionPlatform from '../../platforms/extension';

export const OAuthServiceInit: MessengerClientInitFunction<
  OAuthService,
  OAuthServiceMessenger
> = (request) => {
  const { controllerMessenger, getMessengerClient } = request;

  const metaMetricsController = getMessengerClient(
    'MetaMetricsController',
  ) as MetaMetricsController;
  const analyticsController = getMessengerClient(
    'AnalyticsController',
  ) as AnalyticsController;

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

    addEventBeforeMetricsOptIn:
      metaMetricsController.addEventBeforeMetricsOptIn.bind(
        metaMetricsController,
      ),

    getCompletedMetaMetricsOnboarding: () =>
      metaMetricsController.state.completedMetaMetricsOnboarding === true,
    getOptedIn: () => analyticsController.state.optedIn === true,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
