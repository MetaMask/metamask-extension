import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { RestrictedMessenger } from '@metamask/base-controller';
import { OAuthErrorMessages } from '../../../../shared/modules/error';
import { checkForLastError } from '../../../../shared/modules/browser-runtime.utils';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { BaseLoginHandler } from './base-login-handler';
import { createLoginHandler } from './create-login-handler';
import {
  OAuthConfig,
  OAuthLoginEnv,
  OAuthLoginResult,
  OAuthRefreshTokenResult,
  OAuthServiceAction,
  OAuthServiceEvent,
  OAuthServiceOptions,
  SERVICE_NAME,
  ServiceName,
  WebAuthenticator,
} from './types';
import { loadOAuthConfig } from './config';

const AUTH_SERVER_MARKETING_OPT_IN_STATUS_POST_PATH =
  '/api/v1/oauth/marketing_opt_in_status';

export default class OAuthService {
  // Required for modular initialisation.
  name: ServiceName = SERVICE_NAME;

  state = null;

  #messenger: RestrictedMessenger<
    typeof SERVICE_NAME,
    OAuthServiceAction,
    OAuthServiceEvent,
    OAuthServiceAction['type'],
    OAuthServiceEvent['type']
  >;

  #env: OAuthConfig & OAuthLoginEnv;

  #webAuthenticator: WebAuthenticator;

  #bufferedTrace: OAuthServiceOptions['bufferedTrace'];

  #bufferedEndTrace: OAuthServiceOptions['bufferedEndTrace'];

  constructor({
    messenger,
    env,
    webAuthenticator,
    bufferedTrace,
    bufferedEndTrace,
  }: OAuthServiceOptions) {
    this.#messenger = messenger;

    const oauthConfig = loadOAuthConfig();
    this.#env = {
      ...env,
      ...oauthConfig,
    };
    this.#webAuthenticator = webAuthenticator;
    this.#bufferedTrace = bufferedTrace;
    this.#bufferedEndTrace = bufferedEndTrace;

    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:startOAuthLogin`,
      this.startOAuthLogin.bind(this),
    );

    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:getNewRefreshToken`,
      this.getNewRefreshToken.bind(this),
    );

    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:revokeAndGetNewRefreshToken`,
      this.revokeAndGetNewRefreshToken.bind(this),
    );
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
      this.#env,
      this.#webAuthenticator,
    );

    return this.#handleOAuthLogin(loginHandler);
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
      this.#env,
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
   * Revoke the current refresh token and get a new refresh token.
   *
   * @param options - The options for the revoke and get new refresh token.
   * @param options.connection - The social login type to login with.
   * @param options.revokeToken - The revoke token to authenticate the revoke request.
   * @returns The new refresh token and revoke token.
   */
  async revokeAndGetNewRefreshToken(options: {
    connection: AuthConnection;
    revokeToken: string;
  }): Promise<{ newRevokeToken: string; newRefreshToken: string }> {
    const { connection, revokeToken } = options;
    const loginHandler = createLoginHandler(
      connection,
      this.#env,
      this.#webAuthenticator,
    );

    const res = await loginHandler.revokeRefreshToken(revokeToken);
    return {
      newRefreshToken: res.refresh_token,
      newRevokeToken: res.revoke_token,
    };
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
   * @returns The login result.
   */
  async #handleOAuthLogin(loginHandler: BaseLoginHandler) {
    const authUrl = await loginHandler.getAuthUrl();

    let providerLoginSuccess = false;
    let redirectUrlFromOAuth = null;
    try {
      this.#bufferedTrace?.({
        name: TraceName.OnboardingOAuthProviderLogin,
        op: TraceOperation.OnboardingSecurityOp,
      });
      // launch the web auth flow to get the Authorization Code from the social login provider
      redirectUrlFromOAuth = await new Promise<string>((resolve, reject) => {
        // since promise returns aren't supported until MV3, we need to use a callback function to support MV2
        this.#webAuthenticator.launchWebAuthFlow(
          {
            interactive: true,
            url: authUrl,
          },
          (responseUrl) => {
            try {
              if (responseUrl) {
                try {
                  loginHandler.validateState(responseUrl);
                  resolve(responseUrl);
                } catch (error) {
                  reject(error);
                }
              } else {
                if (this.#isUserCancelledLoginError()) {
                  reject(
                    new Error(OAuthErrorMessages.USER_CANCELLED_LOGIN_ERROR),
                  );
                  return;
                }
                reject(
                  new Error(OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR),
                );
              }
            } catch (error: unknown) {
              reject(error);
            }
          },
        );
      });
      providerLoginSuccess = true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.#bufferedTrace?.({
        name: TraceName.OnboardingOAuthProviderLoginError,
        op: TraceOperation.OnboardingError,
        tags: { errorMessage },
      });
      this.#bufferedEndTrace?.({
        name: TraceName.OnboardingOAuthProviderLoginError,
      });

      throw error;
    } finally {
      this.#bufferedEndTrace?.({
        name: TraceName.OnboardingOAuthProviderLogin,
        data: { success: providerLoginSuccess },
      });
    }

    let getAuthTokensSuccess = false;
    try {
      this.#bufferedTrace?.({
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokens,
        op: TraceOperation.OnboardingSecurityOp,
      });
      // handle the OAuth response from the social login provider and get the Jwt Token in exchange
      const loginResult = await this.#handleOAuthResponse(
        loginHandler,
        redirectUrlFromOAuth,
      );
      getAuthTokensSuccess = true;
      return loginResult;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.#bufferedTrace?.({
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokensError,
        op: TraceOperation.OnboardingError,
        tags: { errorMessage },
      });
      this.#bufferedEndTrace?.({
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokensError,
      });

      throw error;
    } finally {
      this.#bufferedEndTrace?.({
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokens,
        data: { success: getAuthTokensSuccess },
      });
    }
  }

  /**
   * Handle the OAuth response from the social login provider and get the Jwt Token in exchange.
   *
   * The Social Login Auth Server returned the Authorization Code in the redirect URL.
   * This function will extract the Authorization Code from the redirect URL,
   * use it to get the Jwt Token from the Web3Auth Authentication Server.
   *
   * @param loginHandler - The login handler to use.
   * @param redirectUrl - The redirect URL from webAuthFlow which includes the Authorization Code.
   * @returns The login result.
   */
  async #handleOAuthResponse(
    loginHandler: BaseLoginHandler,
    redirectUrl: string,
  ): Promise<OAuthLoginResult> {
    const { authConnection } = loginHandler;

    // We still need to extract the Authorization Code from the redirect URL for Google login (PKCE flow)
    // For Apple login (BFF flow), the Authorization Code is returned to the Authentication Server in the redirect URL
    const authCode =
      authConnection === AuthConnection.Google
        ? this.#getRedirectUrlAuthCode(redirectUrl)
        : null;

    const res = await this.#getAuthIdToken(loginHandler, authCode);
    return res;
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
    authCode: string | null,
  ): Promise<OAuthLoginResult> {
    let authConnectionId = '';
    let groupedAuthConnectionId = '';

    if (process.env.IN_TEST) {
      const { MOCK_AUTH_CONNECTION_ID, MOCK_GROUPED_AUTH_CONNECTION_ID } =
        // Use `require` to make it easier to exclude this test code from the Browserify build.
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
        require('../../../../test/e2e/constants');
      authConnectionId = MOCK_AUTH_CONNECTION_ID;
      groupedAuthConnectionId = MOCK_GROUPED_AUTH_CONNECTION_ID;
    } else if (loginHandler.authConnection === AuthConnection.Google) {
      authConnectionId = this.#env.googleAuthConnectionId;
      groupedAuthConnectionId = this.#env.googleGroupedAuthConnectionId;
    } else if (loginHandler.authConnection === AuthConnection.Apple) {
      authConnectionId = this.#env.appleAuthConnectionId;
      groupedAuthConnectionId = this.#env.appleGroupedAuthConnectionId;
    }

    const authTokenData = await loginHandler.getAuthIdToken(authCode);
    const idToken = authTokenData.id_token;
    const userInfo = await loginHandler.getUserInfo(idToken);

    return {
      authConnectionId,
      groupedAuthConnectionId,
      userId: userInfo.sub || userInfo.email,
      idTokens: [idToken],
      authConnection: loginHandler.authConnection,
      socialLoginEmail: userInfo.email,
      refreshToken: authTokenData.refresh_token,
      revokeToken: authTokenData.revoke_token,
      accessToken: authTokenData.access_token,
      metadataAccessToken: authTokenData.metadata_access_token,
    };
  }

  #getRedirectUrlAuthCode(redirectUrl: string): string | null {
    const url = new URL(redirectUrl);
    return url.searchParams.get('code');
  }

  #isUserCancelledLoginError(): boolean {
    const error = checkForLastError();
    return error?.message === OAuthErrorMessages.USER_CANCELLED_LOGIN_ERROR;
  }

  async setMarketingConsent(): Promise<boolean> {
    const state = this.#messenger.call('SeedlessOnboardingController:getState');
    const { accessToken } = state;
    const requestData = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      opt_in_status: true,
    };

    const res = await fetch(
      `${this.#env.authServerUrl}${AUTH_SERVER_MARKETING_OPT_IN_STATUS_POST_PATH}`,
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
  }
}
