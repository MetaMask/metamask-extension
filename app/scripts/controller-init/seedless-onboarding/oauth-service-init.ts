import { ControllerInitFunction } from '../types';
import OAuthService from '../../services/oauth/oauth-service';
import { OAuthServiceMessenger } from '../messengers/seedless-onboarding';
import { webAuthenticatorFactory } from '../../services/oauth/web-authenticator-factory';
import MetaMetricsController from '../../controllers/metametrics-controller';

export const OAuthServiceInit: ControllerInitFunction<
  OAuthService,
  OAuthServiceMessenger
> = (request) => {
  const { controllerMessenger, getController } = request;

  const metaMetricsController = getController(
    'MetaMetricsController',
  ) as MetaMetricsController;

  const service = new OAuthService({
    messenger: controllerMessenger,
    env: {
      googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
      appleClientId: process.env.APPLE_CLIENT_ID ?? '',
    },
    webAuthenticator: webAuthenticatorFactory(),

    // @ts-expect-error: TODO: Investigate type mismatch.
    bufferedTrace: metaMetricsController.bufferedTrace.bind(
      metaMetricsController,
    ),

    // @ts-expect-error: TODO: Investigate type mismatch.
    bufferedEndTrace: metaMetricsController.bufferedEndTrace.bind(
      metaMetricsController,
    ),
  });

  return {
    controller: service,
    memStateKey: null,
    persistedStateKey: null,
  };
};
