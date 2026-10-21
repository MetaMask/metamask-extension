import log from 'loglevel';
import {
  createSentryError,
  isUserCancelledLoginError,
  OAuthErrorMessages,
} from '../../../../shared/lib/error';
import { checkForLastError } from '../../../../shared/lib/browser-runtime.utils';
import {
  TraceName,
  TraceOperation,
  type SerializedTraceContext,
} from '../../../../shared/lib/trace';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
  MetaMetricsEventAccountType,
} from '../../../../shared/constants/metametrics';
import {
  AuthConnection,
  FirstTimeFlowType,
} from '../../../../shared/constants/onboarding';
import { createEventBuilder } from '../../controllers/analytics';
import ExtensionPlatform from '../../platforms/extension';
import { BaseLoginHandler } from './base-login-handler';
import { createLoginHandler } from './create-login-handler';
import {
  OAuthConfig,
  OAuthLoginResult,
  OAuthRefreshTokenResult,
  OAuthServiceMessenger,
  OAuthServiceOptions,
  OAuthTraceTags,
  SERVICE_NAME,
  ServiceName,
  WebAuthenticator,
} from './types';
import { loadOAuthConfig } from './config';
import { getOAuthTraceTags } from './utils';

const MESSENGER_EXPOSED_METHODS = [
  'startOAuthLogin',
  'getNewRefreshToken',
  'revokeRefreshToken',
  'renewRefreshToken',
] as const;

export class OAuthService {
  // Required for modular initialisation.
  name: ServiceName = SERVICE_NAME;

  state = null;

  #messenger: OAuthServiceMessenger;

  #config: OAuthConfig;

  #webAuthenticator: WebAuthenticator;

  #platform: ExtensionPlatform;

  #trackEvent: OAuthServiceOptions['trackEvent'];

  constructor({
    messenger,
    webAuthenticator,
    platform,
    trackEvent,
  }: OAuthServiceOptions) {
    this.#messenger = messenger;

    this.#config = loadOAuthConfig();
    this.#webAuthenticator = webAuthenticator;
    this.#platform = platform;
    this.#trackEvent = trackEvent;

    this.#messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
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
   * @param parentTraceContext - Optional serialized parent context for OAuth traces.
   * @returns The login result.
   */
  async startOAuthLogin(
    authConnection: AuthConnection,
    parentTraceContext?: SerializedTraceContext,
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
      parentTraceContext,
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
   * @param parentTraceContext
   * @returns The login result.
   */
  async #handleOAuthLogin(
    loginHandler: BaseLoginHandler,
    authConnection: AuthConnection,
    parentTraceContext?: SerializedTraceContext,
  ): Promise<OAuthLoginResult> {
    const isRehydration = this.#isRehydrationFlow();
    const redirectUrlFromOAuth = await this.#performOAuthProviderLogin({
      authConnection,
      isRehydration,
      loginHandler,
      parentTraceContext,
    });

    return await this.#exchangeOAuthTokens({
      authConnection,
      isRehydration,
      loginHandler,
      redirectUrlFromOAuth,
      parentTraceContext,
    });
  }

  async #performOAuthProviderLogin({
    authConnection,
    isRehydration,
    loginHandler,
    parentTraceContext,
  }: {
    authConnection: AuthConnection;
    isRehydration: boolean | null;
    loginHandler: BaseLoginHandler;
    parentTraceContext?: SerializedTraceContext;
  }): Promise<string> {
    let providerLoginSuccess = false;
    const oauthTraceTags = getOAuthTraceTags(authConnection, isRehydration);

    try {
      this.#messenger.call('SentryTracingService:bufferedTrace', {
        name: TraceName.OnboardingOAuthProviderLogin,
        op: TraceOperation.OnboardingSecurityOp,
        tags: oauthTraceTags,
        ...(parentTraceContext && { parentContext: parentTraceContext }),
      });
      const redirectUrlFromOAuth = await this.#launchAuthFlow(
        authConnection,
        loginHandler,
        oauthTraceTags,
        parentTraceContext,
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
        this.#messenger.call('SentryTracingService:bufferedTrace', {
          name: TraceName.OnboardingOAuthProviderLoginError,
          op: TraceOperation.OnboardingError,
          tags: oauthTraceTags,
          ...(parentTraceContext && { parentContext: parentTraceContext }),
        });
        this.#messenger.call('SentryTracingService:bufferedEndTrace', {
          name: TraceName.OnboardingOAuthProviderLoginError,
        });
        this.#messenger.captureException?.(
          createSentryError(
            `${TraceName.OnboardingOAuthProviderLoginError} (${authConnection})`,
            error,
          ),
        );
      }

      throw error;
    } finally {
      this.#messenger.call('SentryTracingService:bufferedEndTrace', {
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
    parentTraceContext,
  }: {
    authConnection: AuthConnection;
    isRehydration: boolean | null;
    loginHandler: BaseLoginHandler;
    redirectUrlFromOAuth: string;
    parentTraceContext?: SerializedTraceContext;
  }): Promise<OAuthLoginResult> {
    let getAuthTokensSuccess = false;

    try {
      this.#messenger.call('SentryTracingService:bufferedTrace', {
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokens,
        op: TraceOperation.OnboardingSecurityOp,
        tags: getOAuthTraceTags(authConnection, isRehydration),
        ...(parentTraceContext && { parentContext: parentTraceContext }),
      });
      const loginResult = await this.#handleOAuthResponse(
        loginHandler,
        redirectUrlFromOAuth,
      );
      getAuthTokensSuccess = true;
      return loginResult;
    } catch (error: unknown) {
      this.#messenger.call('SentryTracingService:bufferedTrace', {
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokensError,
        op: TraceOperation.OnboardingError,
        tags: getOAuthTraceTags(authConnection, isRehydration),
        ...(parentTraceContext && { parentContext: parentTraceContext }),
      });
      this.#messenger.call('SentryTracingService:bufferedEndTrace', {
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokensError,
      });
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
      this.#messenger.call('SentryTracingService:bufferedEndTrace', {
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
    this.#trackEvent(
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
    oauthTraceTags: OAuthTraceTags,
    parentTraceContext?: SerializedTraceContext,
  ): Promise<string> {
    this.#messenger.call('SentryTracingService:bufferedTrace', {
      name: TraceName.OnboardingOAuthProviderLaunch,
      op: TraceOperation.OnboardingSecurityOp,
      tags: oauthTraceTags,
      ...(parentTraceContext && { parentContext: parentTraceContext }),
    });

    let launchTraceEnded = false;
    const endLaunchTrace = (success: boolean): void => {
      if (launchTraceEnded) {
        return;
      }

      launchTraceEnded = true;
      this.#messenger.call('SentryTracingService:bufferedEndTrace', {
        name: TraceName.OnboardingOAuthProviderLaunch,
        data: { success },
      });
    };

    try {
      const authUrl = await loginHandler.getAuthUrl();

      if (authConnection === AuthConnection.Telegram) {
        return await this.#launchTabAuthFlow({
          authUrl,
          extensionRedirectURL: this.#webAuthenticator.getRedirectURL(),
          loginHandler,
          oauthTraceTags,
          parentTraceContext,
          endLaunchTrace,
        });
      }

      return this.#launchWebAuthFlow({
        authUrl,
        loginHandler,
        oauthTraceTags,
        parentTraceContext,
        endLaunchTrace,
      });
    } catch (error) {
      endLaunchTrace(false);
      throw error;
    }
  }

  /**
   * Launches the standard browser web authentication flow.
   *
   * @param options - The web authentication flow options.
   * @param options.authUrl - The authentication URL.
   * @param options.loginHandler - The login handler.
   * @param options.oauthTraceTags - The OAuth trace tags.
   * @param options.parentTraceContext - The optional parent trace context.
   * @param options.endLaunchTrace - Ends the launch trace.
   * @returns The validated OAuth response URL.
   */
  #launchWebAuthFlow({
    authUrl,
    loginHandler,
    oauthTraceTags,
    parentTraceContext,
    endLaunchTrace,
  }: {
    authUrl: string;
    loginHandler: BaseLoginHandler;
    oauthTraceTags: OAuthTraceTags;
    parentTraceContext?: SerializedTraceContext;
    endLaunchTrace: (success: boolean) => void;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      const endProviderInteractionTrace = this.#startProviderInteractionTrace(
        oauthTraceTags,
        parentTraceContext,
      );

      let launchDispatched = false;
      // Synchronous dispatch errors are caught here. The provider response arrives through the callback.
      // prettier-ignore
      try { // NOSONAR
        this.#webAuthenticator.launchWebAuthFlow(
          { interactive: true, url: authUrl },
          (responseUrl) => {
            if (!responseUrl) {
              endProviderInteractionTrace(false);
              reject(this.#getAuthFlowError());
              return;
            }

            try {
              loginHandler.validateState(responseUrl);
              endProviderInteractionTrace(true);
              resolve(responseUrl);
            } catch (error) {
              endProviderInteractionTrace(false);
              reject(error);
            }
          },
        );
        launchDispatched = true;
      } catch (error) {
        endProviderInteractionTrace(false);
        reject(error);
      } finally {
        endLaunchTrace(launchDispatched);
      }
    });
  }

  /**
   * Telegram login needs a real browser tab instead of the standard
   * `launchWebAuthFlow` popup because of "Authorization page could not be loaded"
   * @param options - The Telegram auth flow options.
   * @param options.authUrl - The authentication URL.
   * @param options.extensionRedirectURL - The extension redirect URL.
   * @param options.loginHandler - The login handler.
   * @param options.oauthTraceTags - The OAuth trace tags.
   * @param options.parentTraceContext - The optional parent trace context.
   * @param options.endLaunchTrace - Ends the launch trace.
   */
  async #launchTabAuthFlow({
    authUrl,
    extensionRedirectURL,
    loginHandler,
    oauthTraceTags,
    parentTraceContext,
    endLaunchTrace,
  }: {
    authUrl: string;
    extensionRedirectURL: string;
    loginHandler: BaseLoginHandler;
    oauthTraceTags: OAuthTraceTags;
    parentTraceContext?: SerializedTraceContext;
    endLaunchTrace: (success: boolean) => void;
  }): Promise<string> {
    try {
      const openedTab = await this.#platform.openTab({
        url: authUrl,
        active: true,
      });
      const openedTabId = openedTab.id;

      if (openedTabId === undefined) {
        throw this.#getAuthFlowError();
      }

      const confirmedTabId: number = openedTabId;
      endLaunchTrace(true);

      const endProviderInteractionTrace = this.#startProviderInteractionTrace(
        oauthTraceTags,
        parentTraceContext,
      );

      const redirectUrl = await new Promise<string>((resolve, reject) => {
        const platform = this.#platform;

        function cleanup(): void {
          platform.removeTabUpdatedListener(onUpdated);
          platform.removeTabRemovedListener(onRemoved);
        }

        function finish(success: boolean, callback: () => void): void {
          cleanup();
          endProviderInteractionTrace(success);
          platform.closeTab(confirmedTabId).catch(() => undefined);
          callback();
        }

        function onUpdated(
          tabId: number,
          changeInfo: { url?: string; pendingUrl?: string },
          tab: { url?: string },
        ): void {
          if (tabId !== confirmedTabId) {
            return;
          }

          const candidateUrl =
            changeInfo?.url || changeInfo?.pendingUrl || tab?.url;

          if (!candidateUrl?.startsWith(extensionRedirectURL)) {
            return;
          }

          try {
            loginHandler.validateState(candidateUrl);
            finish(true, () => resolve(candidateUrl));
          } catch (error) {
            finish(false, () => reject(error));
          }
        }

        function onRemoved(tabId: number): void {
          if (tabId !== confirmedTabId) {
            return;
          }

          cleanup();
          endProviderInteractionTrace(false);
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

  /**
   * Starts the provider interaction trace and returns a function that ends it once.
   *
   * @param oauthTraceTags - The OAuth trace tags.
   * @param parentTraceContext - The optional parent trace context.
   * @returns A function that ends the provider interaction trace.
   */
  #startProviderInteractionTrace(
    oauthTraceTags: OAuthTraceTags,
    parentTraceContext?: SerializedTraceContext,
  ): (success: boolean) => void {
    let providerInteractionTraceEnded = false;
    const endProviderInteractionTrace = (success: boolean): void => {
      if (providerInteractionTraceEnded) {
        return;
      }

      providerInteractionTraceEnded = true;
      this.#messenger.call('SentryTracingService:bufferedEndTrace', {
        name: TraceName.OnboardingOAuthProviderInteraction,
        data: { success },
      });
    };

    this.#messenger.call('SentryTracingService:bufferedTrace', {
      name: TraceName.OnboardingOAuthProviderInteraction,
      op: TraceOperation.OnboardingSecurityOp,
      tags: oauthTraceTags,
      ...(parentTraceContext && { parentContext: parentTraceContext }),
    });

    return endProviderInteractionTrace;
  }
}
