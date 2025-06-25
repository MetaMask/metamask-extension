import {
  AuthConnection,
  Web3AuthNetwork,
} from '@metamask/seedless-onboarding-controller';
import { OAuthErrorMessages } from '../../../../shared/modules/error';
import { ENVIRONMENT } from '../../../../development/build/constants';
import { BaseLoginHandler } from './base-login-handler';
import { createLoginHandler } from './create-login-handler';
import type {
  OAuthConfig,
  OAuthLoginEnv,
  OAuthLoginResult,
  OAuthServiceOptions,
  WebAuthenticator,
} from './types';
import { OAUTH_CONFIG } from './constants';

export default class OAuthService {
  #env: OAuthConfig & OAuthLoginEnv;

  #webAuthenticator: WebAuthenticator;

  constructor({ env, webAuthenticator }: OAuthServiceOptions) {
    this.#env = {
      ...env,
      ...this.#loadConfig(),
    };
    this.#webAuthenticator = webAuthenticator;
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
    // request the identity permission from the user
    // 'identity' permission is required for the OAuth login
    const permissionGranted =
      await this.#webAuthenticator.requestIdentityPermission();
    if (!permissionGranted) {
      throw new Error(OAuthErrorMessages.PERMISSION_NOT_GRANTED_ERROR);
    }

    // create the login handler for the given social login type
    // this is to get the Jwt Token in the exchange for the Authorization Code
    const loginHandler = createLoginHandler(
      authConnection,
      this.#env,
      this.#webAuthenticator,
    );

    try {
      return this.#handleOAuthLogin(loginHandler);
    } catch (error) {
      if (this.#isUserCancelledLoginError()) {
        throw new Error(OAuthErrorMessages.USER_CANCELLED_LOGIN_ERROR);
      }
      throw error;
    }
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
  }): Promise<{ idTokens: string[] }> {
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

  #loadConfig(): OAuthConfig {
    const { METAMASK_ENVIRONMENT, METAMASK_BUILD_TYPE } = process.env;
    const buildType = METAMASK_BUILD_TYPE || 'development';

    let config: Record<string, string> = {};
    if (METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT) {
      config = OAUTH_CONFIG.development;
    } else {
      config = OAUTH_CONFIG[buildType];
    }

    return {
      authServerUrl: config.AUTH_SERVER_URL,
      web3AuthNetwork: config.WEB3AUTH_NETWORK as Web3AuthNetwork,
      googleAuthConnectionId: config.GOOGLE_AUTH_CONNECTION_ID,
      googleGrouppedAuthConnectionId: config.GOOGLE_GROUPED_AUTH_CONNECTION_ID,
      appleAuthConnectionId: config.APPLE_AUTH_CONNECTION_ID,
      appleGrouppedAuthConnectionId: config.APPLE_GROUPED_AUTH_CONNECTION_ID,
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

    // launch the web auth flow to get the Authorization Code from the social login provider
    const redirectUrlFromOAuth = await new Promise<string>(
      (resolve, reject) => {
        // since promise returns aren't supported until MV3, we need to use a callback function to support MV2
        this.#webAuthenticator.launchWebAuthFlow(
          {
            interactive: true,
            url: authUrl,
          },
          (responseUrl) => {
            try {
              if (responseUrl) {
                resolve(responseUrl);
              } else {
                reject(
                  new Error(OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR),
                );
              }
            } catch (error: unknown) {
              reject(error);
            }
          },
        );
      },
    );

    // handle the OAuth response from the social login provider and get the Jwt Token in exchange
    const loginResult = await this.#handleOAuthResponse(
      loginHandler,
      redirectUrlFromOAuth,
    );
    return loginResult;
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
    const authConnectionId =
      loginHandler.authConnection === AuthConnection.Google
        ? this.#env.googleAuthConnectionId
        : this.#env.appleAuthConnectionId;
    const groupedAuthConnectionId =
      loginHandler.authConnection === AuthConnection.Google
        ? this.#env.googleGrouppedAuthConnectionId
        : this.#env.appleGrouppedAuthConnectionId;

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
    };
  }

  #getRedirectUrlAuthCode(redirectUrl: string): string | null {
    const url = new URL(redirectUrl);
    return url.searchParams.get('code');
  }

  #isUserCancelledLoginError(): boolean {
    const error = browser.runtime.lastError;
    return (
      (error instanceof Error &&
        error.message === OAuthErrorMessages.USER_CANCELLED_LOGIN_ERROR) ||
      browser.runtime.lastError?.message ===
        OAuthErrorMessages.USER_CANCELLED_LOGIN_ERROR
    );
  }
}
