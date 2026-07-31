import log from 'loglevel';
import {
  createSentryError,
  isUserCancelledLoginError,
  OAuthErrorMessages,
} from '../../../../shared/lib/error';
import { checkForLastError } from '../../../../shared/lib/browser-runtime.utils';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
  MetaMetricsEventAccountType,
  MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
import {
  AuthConnection,
  FirstTimeFlowType,
} from '../../../../shared/constants/onboarding';
import ExtensionPlatform from '../../platforms/extension';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import type { AnalyticsEvent } from '../../controllers/analytics';
import { BaseLoginHandler } from './base-login-handler';
import { createLoginHandler } from './create-login-handler';
import {
  OAuthConfig,
  OAuthLoginResult,
  OAuthRefreshTokenResult,
  OAuthServiceMessenger,
  OAuthServiceOptions,
  SERVICE_NAME,
  ServiceName,
  WebAuthenticator,
} from './types';
import { loadOAuthConfig } from './config';

const AUTH_SERVER_MARKETING_OPT_IN_STATUS_PATH =
  '/api/v1/oauth/marketing_opt_in_status';

const MESSENGER_EXPOSED_METHODS = [
  'startOAuthLogin',
  'getNewRefreshToken',
  'revokeRefreshToken',
  'renewRefreshToken',
  'getMarketingConsent',
  'setMarketingConsent',
] as const;

export class OAuthService {
  // Required for modular initialisation.
  name: ServiceName = SERVICE_NAME;

  state = null;

  #messenger: OAuthServiceMessenger;

  #config: OAuthConfig;

  #webAuthenticator: WebAuthenticator;

  #platform: ExtensionPlatform;

  #bufferedTrace: OAuthServiceOptions['bufferedTrace'];

  #bufferedEndTrace: OAuthServiceOptions['bufferedEndTrace'];

  #addEventBeforeMetricsOptIn: OAuthServiceOptions['addEventBeforeMetricsOptIn'];

  #getCompletedMetaMetricsOnboarding: OAuthServiceOptions['getCompletedMetaMetricsOnboarding'];

  #getOptedIn: OAuthServiceOptions['getOptedIn'];

  constructor({
    messenger,
    webAuthenticator,
    platform,
    bufferedTrace,
    bufferedEndTrace,
    addEventBeforeMetricsOptIn,
    getCompletedMetaMetricsOnboarding,
    getOptedIn,
  }: OAuthServiceOptions) {
    this.#messenger = messenger;

    this.#config = loadOAuthConfig();
    this.#webAuthenticator = webAuthenticator;
    this.#platform = platform;
    this.#bufferedTrace = bufferedTrace;
    this.#bufferedEndTrace = bufferedEndTrace;
    this.#addEventBeforeMetricsOptIn = addEventBeforeMetricsOptIn;
    this.#getCompletedMetaMetricsOnboarding = getCompletedMetaMetricsOnboarding;
    this.#getOptedIn = getOptedIn;

    this.#messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }

  /**
   * Track a MetaMetrics event with buffering (handles consent checking)
   *
   * @param built - The built analytics event.
   */
  #trackEventWithBuffering(built: AnalyticsEvent): void {
    const isMetricsEnabled =
      this.#getCompletedMetaMetricsOnboarding() && this.#getOptedIn();

    if (isMetricsEnabled) {
      trackEvent(built);
      return;
    }

    const { category, ...properties } = built.properties;
    const bufferedPayload: MetaMetricsEventPayload = {
      event: built.name,
      category: category as MetaMetricsEventCategory,
      properties: {
        ...properties,
        actionId: `${Date.now() + Math.random()}`,
      },
      sensitiveProperties: built.sensitiveProperties,
    };
    this.#addEventBeforeMetricsOptIn(bufferedPayload);
  }

  /**
   * Determine if the current flow is a rehydration (existing user coming back)
   *
   * @returns True if this is a rehydration flow, false if not, null if status couldn't be determined
   */
  #isRehydrationFlow(): boolean | null {
    try {
      const state = this.#messenger.call('OnboardingController:getState');
      return (
        state.firstTimeFlowType === FirstTimeFlowType.socialImport &&
        !state.completedOnboarding
      );
    } catch (error) {
      log.error('Error checking rehydration flow:', error);
      return null;
    }
  }

  /**
   * Start the OAuth login process for the given social login type.
   *
   * @param authConnection - The social login type to login with.
   * @returns The login result.
   */
  async startOAuthLogin(
    authConnection: AuthConnection,
  ): Promise<OAuthLoginResult> {
    // create the login handler for the given social login type
    // this is to get the Jwt Token in the exchange for the Authorization Code
    const loginHandler = createLoginHandler(
      authConnection,
      this.#config,
      this.#webAuthenticator,
    );

    // get the user location to determine if the user is in US region
    // the location value will be used later to determine if Marketing Opt-in should be enabled by default
    this.#messenger
      .call('GeolocationController:getGeolocation')
      .catch((error) => {
        log.error('Error getting user location:', error);
      });

    const oAuthLoginResult = await this.#handleOAuthLogin(
      loginHandler,
      authConnection,
    );
    return oAuthLoginResult;
  }

  /**
   * Get a new refresh token from the Web3Auth Authentication Server.
   *
   * @param options - The options for the get new refresh token.
   * @param options.connection - The social login type to login with.
   * @param options.refreshToken - The refresh token to authenticate the refresh request.
   * @returns The new refresh token.
   */
  async getNewRefreshToken(options: {
    connection: AuthConnection;
    refreshToken: string;
  }): Promise<OAuthRefreshTokenResult> {
    const { connection, refreshToken } = options;
    const loginHandler = createLoginHandler(
      connection,
      this.#config,
      this.#webAuthenticator,
    );

    const refreshTokenData = await loginHandler.refreshAuthToken(refreshToken);
    const idToken = refreshTokenData.id_token;

    return {
      idTokens: [idToken],
      accessToken: refreshTokenData.access_token,
      metadataAccessToken: refreshTokenData.metadata_access_token,
    };
  }

  /**
   * Renew the refresh token - get a new refresh token and revoke token.
   *
   * @param options - The options for the revoke and get new refresh token.
   * @param options.connection - The social login type to login with.
   * @param options.revokeToken - The revoke token to authenticate the request.
   * @returns The new refresh token and revoke token.
   */
  async renewRefreshToken(options: {
    connection: AuthConnection;
    revokeToken: string;
  }): Promise<{ newRevokeToken: string; newRefreshToken: string }> {
    const { connection, revokeToken } = options;
    const loginHandler = createLoginHandler(
      connection,
      this.#config,
      this.#webAuthenticator,
    );

    const res = await loginHandler.renewRefreshToken(revokeToken);
    return {
      newRefreshToken: res.refresh_token,
      newRevokeToken: res.revoke_token,
    };
  }

  async revokeRefreshToken(options: {
    connection: AuthConnection;
    revokeToken: string;
  }): Promise<void> {
    const { connection, revokeToken } = options;
    const loginHandler = createLoginHandler(
      connection,
      this.#config,
      this.#webAuthenticator,
    );

    await loginHandler.revokeRefreshToken(revokeToken);
  }

  /**
   * Handle the OAuth login for the given social login type.
   *
   * For Google login, we will use the `PKCE` flow to get the Authorization Code.
   * For Apple login, we will use the `server-redirect` flow to get the Authorization Code.
   *
   * Then, we will use the Authorization Code to get the Jwt Token from the Web3Auth Authentication Server.
   *
   * @param loginHandler - The login handler to use.
   * @param authConnection - The auth connection type (google | apple).
   * @returns The login result.
   */
  async #handleOAuthLogin(
    loginHandler: BaseLoginHandler,
    authConnection: AuthConnection,
  ): Promise<OAuthLoginResult> {
    const isRehydration = this.#isRehydrationFlow();
    const redirectUrlFromOAuth = await this.#performOAuthProviderLogin({
      authConnection,
      isRehydration,
      loginHandler,
    });

    return await this.#exchangeOAuthTokens({
      authConnection,
      isRehydration,
      loginHandler,
      redirectUrlFromOAuth,
    });
  }

  async #performOAuthProviderLogin({
    authConnection,
    isRehydration,
    loginHandler,
  }: {
    authConnection: AuthConnection;
    isRehydration: boolean | null;
    loginHandler: BaseLoginHandler;
  }): Promise<string> {
    let providerLoginSuccess = false;

    try {
      this.#bufferedTrace?.({
        name: TraceName.OnboardingOAuthProviderLogin,
        op: TraceOperation.OnboardingSecurityOp,
      });
      const redirectUrlFromOAuth = await this.#launchAuthFlow(
        authConnection,
        loginHandler,
      );
      providerLoginSuccess = true;
      return redirectUrlFromOAuth;
    } catch (error: unknown) {
      const loginError = error instanceof Error ? error : undefined;
      const isUserCancelled = isUserCancelledLoginError(loginError);

      this.#trackOAuthLoginFailure({
        authConnection,
        isRehydration,
        errorCategory: 'provider_login',
        failureType: isUserCancelled ? 'user_cancelled' : 'error',
      });

      if (!isUserCancelled) {
        this.#messenger.captureException?.(
          createSentryError(
            `${TraceName.OnboardingOAuthProviderLoginError} (${authConnection})`,
            error,
          ),
        );
      }

      throw error;
    } finally {
      this.#bufferedEndTrace?.({
        name: TraceName.OnboardingOAuthProviderLogin,
        data: { success: providerLoginSuccess },
      });
    }
  }

  async #exchangeOAuthTokens({
    authConnection,
    isRehydration,
    loginHandler,
    redirectUrlFromOAuth,
  }: {
    authConnection: AuthConnection;
    isRehydration: boolean | null;
    loginHandler: BaseLoginHandler;
    redirectUrlFromOAuth: string;
  }): Promise<OAuthLoginResult> {
    let getAuthTokensSuccess = false;

    try {
      this.#bufferedTrace?.({
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokens,
        op: TraceOperation.OnboardingSecurityOp,
      });
      const loginResult = await this.#handleOAuthResponse(
        loginHandler,
        redirectUrlFromOAuth,
      );
      getAuthTokensSuccess = true;
      return loginResult;
    } catch (error: unknown) {
      this.#trackOAuthLoginFailure({
        authConnection,
        isRehydration,
        errorCategory: 'get_auth_tokens',
        failureType: 'error',
      });

      this.#messenger.captureException?.(
        createSentryError(
          `OAuth2 token exchange failed for ${authConnection}`,
          error,
        ),
      );

      throw error;
    } finally {
      this.#bufferedEndTrace?.({
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokens,
        data: { success: getAuthTokensSuccess },
      });
    }
  }

  #trackOAuthLoginFailure({
    authConnection,
    isRehydration,
    errorCategory,
    failureType,
  }: {
    authConnection: AuthConnection;
    isRehydration: boolean | null;
    errorCategory: 'provider_login' | 'get_auth_tokens';
    failureType: 'error' | 'user_cancelled';
  }): void {
    this.#trackEventWithBuffering(
      createEventBuilder(MetaMetricsEventName.SocialLoginFailed)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: `${MetaMetricsEventAccountType.Default}_${authConnection}`,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_rehydration:
            isRehydration === null ? 'unknown' : String(isRehydration),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          failure_type: failureType,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_category: errorCategory,
        })
        .build(),
    );
  }

  /**
   * Handle the OAuth response from the social login provider and get the Jwt Token in exchange.
   *
   * @param loginHandler - The login handler to use.
   * @param redirectUrl - The redirect URL from webAuthFlow.
   * @returns The login result.
   */
  async #handleOAuthResponse(
    loginHandler: BaseLoginHandler,
    redirectUrl: string,
  ): Promise<OAuthLoginResult> {
    const { authConnection } = loginHandler;

    const authCode =
      authConnection === AuthConnection.Google ||
      authConnection === AuthConnection.Telegram
        ? (this.#getRedirectUrlAuthCode(redirectUrl) ?? '')
        : '';

    return await this.#getAuthIdToken(loginHandler, authCode);
  }

  /**
   * Get the Jwt Token from the Web3Auth Authentication Server.
   *
   * @param loginHandler - The login handler to use.
   * @param authCode - The Authorization Code from the social login provider.
   * @returns The login result.
   */
  async #getAuthIdToken(
    loginHandler: BaseLoginHandler,
    authCode: string,
  ): Promise<OAuthLoginResult> {
    let authConnectionId = '';
    let groupedAuthConnectionId = '';

    if (process.env.IN_TEST) {
      const { MOCK_AUTH_CONNECTION_ID, MOCK_GROUPED_AUTH_CONNECTION_ID } =
        // Load conditionally so this test-only code can be dead-code-eliminated from production builds.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../../../../test/e2e/constants');
      authConnectionId = MOCK_AUTH_CONNECTION_ID;
      groupedAuthConnectionId = MOCK_GROUPED_AUTH_CONNECTION_ID;
    } else if (loginHandler.authConnection === AuthConnection.Google) {
      authConnectionId = this.#config.googleAuthConnectionId;
      groupedAuthConnectionId = this.#config.googleGroupedAuthConnectionId;
    } else if (loginHandler.authConnection === AuthConnection.Apple) {
      authConnectionId = this.#config.appleAuthConnectionId;
      groupedAuthConnectionId = this.#config.appleGroupedAuthConnectionId;
    } else if (loginHandler.authConnection === AuthConnection.Telegram) {
      authConnectionId = this.#config.telegramAuthConnectionId;
      groupedAuthConnectionId = this.#config.telegramGroupedAuthConnectionId;
    }

    const authTokenData = await loginHandler.getAuthIdToken(authCode);
    const idToken = authTokenData.id_token;
    const userInfo = await loginHandler.getUserInfo(idToken);

    return {
      authConnectionId,
      groupedAuthConnectionId,
      userId: userInfo.sub || userInfo.email || '',
      idTokens: [idToken],
      authConnection: loginHandler.authConnection,
      socialLoginEmail: userInfo.email,
      refreshToken: authTokenData.refresh_token,
      revokeToken: authTokenData.revoke_token,
      accessToken: authTokenData.access_token,
      metadataAccessToken: authTokenData.metadata_access_token,
      profilePairingToken: authTokenData.profile_pairing_token,
    };
  }

  #getRedirectUrlAuthCode(redirectUrl: string): string | null {
    const url = new URL(redirectUrl);
    return url.searchParams.get('code');
  }

  #getAuthFlowError(error = checkForLastError()): Error {
    if (error) {
      const authFlowError = new Error(
        error.message || OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR,
      ) as Error & {
        cause: Error;
      };
      authFlowError.cause = error;
      return authFlowError;
    }

    return new Error(OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR);
  }

  async #launchAuthFlow(
    authConnection: AuthConnection,
    loginHandler: BaseLoginHandler,
  ): Promise<string> {
    const authUrl = await loginHandler.getAuthUrl();
    if (authConnection === AuthConnection.Telegram) {
      return this.#launchTabAuthFlow(
        authUrl,
        this.#webAuthenticator.getRedirectURL(),
        loginHandler,
      );
    }

    return new Promise((resolve, reject) => {
      this.#webAuthenticator.launchWebAuthFlow(
        { interactive: true, url: authUrl },
        (responseUrl) => {
          if (!responseUrl) {
            reject(this.#getAuthFlowError());
            return;
          }

          try {
            loginHandler.validateState(responseUrl);
            resolve(responseUrl);
          } catch (error) {
            reject(error);
          }
        },
      );
    });
  }

  /**
   * Telegram login needs a real browser tab instead of the standard
   * `launchWebAuthFlow` popup because of "Authorization page could not be loaded"
   * @param authUrl
   * @param extensionRedirectURL
   * @param loginHandler
   */
  async #launchTabAuthFlow(
    authUrl: string,
    extensionRedirectURL: string,
    loginHandler: BaseLoginHandler,
  ): Promise<string> {
    try {
      const openedTab = await this.#platform.openTab({
        url: authUrl,
        active: true,
      });
      const openedTabId = openedTab.id;

      if (openedTabId === undefined) {
        throw this.#getAuthFlowError();
      }

      const redirectUrl = await new Promise<string>((resolve, reject) => {
        const platform = this.#platform;

        function cleanup(): void {
          platform.removeTabUpdatedListener(onUpdated);
          platform.removeTabRemovedListener(onRemoved);
        }

        function finish(callback: () => void): void {
          cleanup();
          platform.closeTab(openedTabId).catch(() => undefined);
          callback();
        }

        function onUpdated(
          tabId: number,
          changeInfo: { url?: string; pendingUrl?: string },
          tab?: { url?: string },
        ): void {
          if (tabId !== openedTabId) {
            return;
          }

          const candidateUrl =
            changeInfo?.url || changeInfo?.pendingUrl || tab?.url;

          if (!candidateUrl?.startsWith(extensionRedirectURL)) {
            return;
          }

          try {
            loginHandler.validateState(candidateUrl);
            finish(() => resolve(candidateUrl));
          } catch (error) {
            finish(() => reject(error));
          }
        }

        function onRemoved(tabId: number): void {
          if (tabId !== openedTabId) {
            return;
          }

          cleanup();
          reject(new Error(OAuthErrorMessages.USER_CANCELLED_LOGIN_ERROR));
        }

        platform.addTabUpdatedListener(onUpdated);
        platform.addTabRemovedListener(onRemoved);
      });

      if (!redirectUrl) {
        throw this.#getAuthFlowError();
      }

      return redirectUrl;
    } catch (error) {
      log.error(
        `Failed to launch tab auth flow for ${loginHandler.authConnection}`,
        error,
      );
      throw error;
    }
  }

  async setMarketingConsent(
    hasEmailMarketingConsent: boolean,
  ): Promise<boolean> {
    try {
      const accessToken = await this.#messenger.call(
        'SeedlessOnboardingController:getAccessToken',
      );
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const requestData = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        opt_in_status: hasEmailMarketingConsent,
      };

      const res = await fetch(
        `${this.#config.authServerUrl}${AUTH_SERVER_MARKETING_OPT_IN_STATUS_PATH}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestData),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to post marketing opt in status');
      }

      return res.ok;
    } catch (error) {
      this.#messenger.captureException?.(
        createSentryError(
          'Failed to post marketing opt in status',
          error as Error,
        ),
      );

      // rethrow the original error
      throw error;
    }
  }

  async getMarketingConsent(): Promise<boolean> {
    try {
      const accessToken = await this.#messenger.call(
        'SeedlessOnboardingController:getAccessToken',
      );
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const res = await fetch(
        `${this.#config.authServerUrl}${AUTH_SERVER_MARKETING_OPT_IN_STATUS_PATH}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error('Failed to get marketing opt in status');
      }

      const data = await res.json();

      return Boolean(data?.is_opt_in ?? false);
    } catch (error) {
      this.#messenger.captureException?.(
        createSentryError(
          'Failed to get marketing opt in status',
          error as Error,
        ),
      );

      return false;
    }
  }
}
