import { BaseController } from '@metamask/base-controller';
import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import {
  controllerName,
  OAuthControllerMessenger,
  OAuthControllerOptions,
  OAuthControllerState,
  OAuthLoginEnv,
  OAuthLoginResult,
} from './types';
import { createLoginHandler } from './login-handler-factory';
import { BaseLoginHandler } from './base-login-handler';

/**
 * Function to get default state of the {@link OAuthController}.
 */
export const getDefaultOAuthControllerState =
  (): Partial<OAuthControllerState> => ({});

/**
 * The OAuth Controller is responsible for handling the Social (OAuth) login process.
 *
 * It will initiate the webAuthFlow to get the authentication code from the social login provider.
 * Then it will use the authentication code to get the Jwt Token from the Web3Auth Authentication Server.
 *
 * The JWT Token will be used to authenticate with the Seedless Onboarding Services.
 */
export default class OAuthController extends BaseController<
  typeof controllerName,
  OAuthControllerState,
  OAuthControllerMessenger
> {
  #env: OAuthLoginEnv;

  constructor({ messenger, env }: OAuthControllerOptions) {
    super({
      messenger,
      metadata: {}, // OAuth Controller is stateless and does not need metadata
      name: controllerName,
      state: {}, // OAuth Controller is stateless and does not need any state
    });

    this.#env = env;
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
    // get the redirect URI for the OAuth login
    const redirectUri = chrome.identity.getRedirectURL();

    // create the login handler for the given social login type
    // this is to get the Jwt Token in the exchange for the Authorization Code
    const loginHandler = createLoginHandler(
      authConnection,
      redirectUri,
      this.#env,
    );

    // launch the web auth flow to get the Authorization Code from the social login provider
    const redirectUrlFromOAuth = await chrome.identity.launchWebAuthFlow({
      interactive: true,
      url: loginHandler.getAuthUrl(),
    });

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
      userId: userInfo.sub,
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
