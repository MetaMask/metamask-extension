import {
  Env as ProfileSyncEnv,
  getEnvUrls,
} from '@metamask/profile-sync-controller/sdk';
import { MessengerClientInitFunction } from '../types';
import { OAuthService } from '../../services/oauth/oauth-service';
import {
  isDevOrTestBuild,
  isProductionBuild,
  isReleaseCandidateBuild,
} from '../../services/oauth/config';
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

  let profileSyncEnv = ProfileSyncEnv.UAT;
  if (isProductionBuild() || isReleaseCandidateBuild()) {
    profileSyncEnv = ProfileSyncEnv.PRD;
  } else if (isDevOrTestBuild()) {
    profileSyncEnv = ProfileSyncEnv.DEV;
  }

  const messengerClient = new OAuthService({
    messenger: controllerMessenger,
    env: {
      googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
      appleClientId: process.env.APPLE_CLIENT_ID ?? '',
      telegramAuthenticationServerUrl: getEnvUrls(profileSyncEnv).authApiUrl,
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
