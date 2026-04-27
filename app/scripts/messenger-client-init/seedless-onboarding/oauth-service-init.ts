import browser from 'webextension-polyfill';
import { Env as ProfileSyncEnv, getEnvUrls } from '@metamask/profile-sync-controller/sdk';
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

const PENDING_PROFILE_PAIRING_TOKENS_SESSION_KEY =
  'pendingSocialLoginProfileJwt';

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

    storePendingSocialLoginProfileJwt: async (jwt: string) => {
      const {
        [PENDING_PROFILE_PAIRING_TOKENS_SESSION_KEY]: pendingJwts = [],
      } = await browser.storage.session.get(
        PENDING_PROFILE_PAIRING_TOKENS_SESSION_KEY,
      );

      await browser.storage.session.set({
        [PENDING_PROFILE_PAIRING_TOKENS_SESSION_KEY]: [...pendingJwts, jwt],
      });
    },

    getPendingSocialLoginProfileJwt: async () => {
      const { [PENDING_PROFILE_PAIRING_TOKENS_SESSION_KEY]: jwts = [] } =
        await browser.storage.session.get(
          PENDING_PROFILE_PAIRING_TOKENS_SESSION_KEY,
        );

      return jwts;
    },

    clearPendingSocialLoginProfileJwt: async () => {
      await browser.storage.session.remove(
        PENDING_PROFILE_PAIRING_TOKENS_SESSION_KEY,
      );
    },
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
