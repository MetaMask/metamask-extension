import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { WebRequest } from 'webextension-polyfill';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { BaseLoginHandler } from './base-login-handler';
import { createLoginHandler } from './create-login-handler';
import type {
  OAuthLoginEnv,
  OAuthLoginResult,
  OAuthServiceOptions,
  WebAuthenticator,
} from './types';

export default class OAuthService {
  #env: OAuthLoginEnv;

  #webAuthenticator: WebAuthenticator;

  constructor({ env, webAuthenticator }: OAuthServiceOptions) {
    this.#env = env;
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
    // create the login handler for the given social login type
    // this is to get the Jwt Token in the exchange for the Authorization Code
    const loginHandler = createLoginHandler(
      authConnection,
      this.#env,
      this.#webAuthenticator,
    );

    const platform = this.#webAuthenticator.getPlatform();
    if (
      platform === PLATFORM_FIREFOX &&
      authConnection === AuthConnection.Apple
    ) {
      const authCode = await this.#handleAppleLoginForFirefox(loginHandler);
      return this.#getAuthIdToken(loginHandler, authCode);
    }

    return this.#handleOAuthLogin(loginHandler);
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
            console.log('responseUrl', responseUrl);
            try {
              if (responseUrl) {
                const url = new URL(responseUrl);
                const state = url.searchParams.get('state');

                loginHandler.validateState(state);
                resolve(responseUrl);
              } else {
                reject(new Error('No redirect URL found'));
              }
            } catch (error: unknown) {
              reject(error);
            }
          },
        );
      },
    );

    if (!redirectUrlFromOAuth) {
      console.error('[identity auth] redirectUrl is null');
      throw new Error('No redirect URL found');
    }

    // handle the OAuth response from the social login provider and get the Jwt Token in exchange
    const loginResult = await this.#handleOAuthResponse(
      loginHandler,
      redirectUrlFromOAuth,
    );
    return loginResult;
  }

  /**
   * Handle the Apple OAuth login for Firefox (especially for Manifest V2).
   *
   * `identity.launchWebAuthFlow` does not work if redirect_uri provided in the authUrl,
   * does not match the value retured by `identity.getRedirectURL()`.
   *
   * Check out {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/identity#getting_the_redirect_url} for more details.
   *
   * So, we cannot use server-redirect flow for Apple login in Manifest V2.
   * Instead, we need to receive `Form Post` request made from the AppleId server and
   * extract the Authorization Code in the onBeforeRequest listener.
   *
   * @param loginHandler - The login handler to use.
   * @returns The Authorization Code.
   */
  async #handleAppleLoginForFirefox(
    loginHandler: BaseLoginHandler,
  ): Promise<string> {
    const authUrl = await loginHandler.getAuthUrl();
    const redirectUri = this.#webAuthenticator.getRedirectURL();

    return new Promise((resolve, reject) => {
      const handleAppleOAuthResponse = (
        details: WebRequest.OnBeforeRequestDetailsType,
      ) => {
        if (details.method === 'POST' && details.url.startsWith(redirectUri)) {
          const formData = details.requestBody?.formData;

          if (formData) {
            const code = formData.code?.[0];
            const state = formData.state?.[0];

            if (code && state) {
              try {
                loginHandler.validateState(state);
                resolve(code);
              } catch (error: unknown) {
                reject(error);
              }
              return;
            }
            reject(new Error('No auth code found'));
          }
          browser.webRequest.onBeforeRequest.removeListener(
            handleAppleOAuthResponse,
          );
        }
      };

      // intercept and receive the `Form Post` request made from the AppleId server after the user has logged in via launchWebAuthFlow
      browser.webRequest.onBeforeRequest.addListener(
        handleAppleOAuthResponse,
        { urls: [`${redirectUri}*`] },
        ['requestBody'],
      );

      // launch the web auth flow to get the Authorization Code from the social login provider
      this.#webAuthenticator.launchWebAuthFlow({
        interactive: true,
        url: authUrl,
      });
    });
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
    const authCode = this.#getRedirectUrlAuthCode(redirectUrl);
    if (!authCode) {
      throw new Error('No auth code found');
    }
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
    authCode: string,
  ): Promise<OAuthLoginResult> {
    const { authConnectionId, groupedAuthConnectionId } = this.#env;
    const audience = 'metamask';

    const authTokenData = await loginHandler.getAuthIdToken(authCode);
    const idToken = authTokenData.jwt_tokens[audience];
    const userInfo = await loginHandler.getUserInfo(idToken);

    return {
      authConnectionId,
      groupedAuthConnectionId,
      userId: userInfo.sub || userInfo.email,
      idTokens: [idToken],
      authConnection: loginHandler.authConnection,
      socialLoginEmail: userInfo.email,
    };
  }

  #getRedirectUrlAuthCode(redirectUrl: string): string | null {
    const url = new URL(redirectUrl);
    return url.searchParams.get('code');
  }
}
