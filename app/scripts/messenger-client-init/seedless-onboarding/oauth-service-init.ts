import { MessengerClientInitFunction } from '../types';
import { OAuthService } from '../../services/oauth/oauth-service';
import { webAuthenticatorFactory } from '../../services/oauth/web-authenticator-factory';
import { OAuthServiceMessenger } from '../../services/oauth/types';
import { MetaMetricsController } from '../../controllers/metametrics-controller';
import ExtensionPlatform from '../../platforms/extension';
import {
  createEventBuilder,
  trackEvent,
} from '../../controllers/analytics/analytics';
import type {
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';

function trackOAuthEvent(
  payload: MetaMetricsEventPayload,
  options?: MetaMetricsEventOptions,
): void {
  trackEvent(
    createEventBuilder(payload.event)
      .addProperties({
        ...(payload.properties ?? {}),
        ...(payload.category === undefined
          ? {}
          : { category: payload.category }),
      })
      .addSensitiveProperties(payload.sensitiveProperties)
      .build(options),
  );
}

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

    trackEvent: trackOAuthEvent,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
