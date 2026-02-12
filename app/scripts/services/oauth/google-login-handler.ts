import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { BaseLoginHandler } from './base-login-handler';
import { AuthTokenResponse, OAuthUserInfo } from './types';
import { decodeIdToken } from './utils';

export class GoogleLoginHandler extends BaseLoginHandler {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public readonly OAUTH_SERVER_URL =
    'https://accounts.google.com/o/oauth2/v2/auth';

  readonly #scope = ['openid', 'profile', 'email'];

  get authConnection() {
    return AuthConnection.Google;
  }

  get scope() {
    return this.#scope;
  }

  /**
   * Generate the Auth URL to initiate the OAuth login to get the Authorization Code from Google Authorization server.
   *
   * @returns The URL to initiate the OAuth login.
   */
  async getAuthUrl(): Promise<string> {
    const authUrl = new URL(this.OAUTH_SERVER_URL);

    const nonce = this.generateNonce();
    const { challenge } = await this.generateCodeVerifierChallenge();
    const redirectUri = this.options.webAuthenticator.getRedirectURL();

    authUrl.searchParams.set('client_id', this.options.oAuthClientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.#scope.join(' '));
    authUrl.searchParams.set(
      'code_challenge_method',
      this.CODE_CHALLENGE_METHOD,
    );
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set(
      'state',
      JSON.stringify({
        nonce,
      }),
    );
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('prompt', this.prompt);

    return authUrl.toString();
  }

  /**
   * Get the JWT Token from the Web3Auth Authentication Server.
   *
   * @param code - The Authorization Code from the social login provider.
   * @returns The JWT Token from the Web3Auth Authentication Server.
   */
  async getAuthIdToken(code: string): Promise<AuthTokenResponse> {
    const requestData = this.generateAuthTokenRequestData(code);
    const res = await this.requestAuthToken(requestData);
    return res;
  }

  /**
   * Generate the request body data to get the JWT Token from the Web3Auth Authentication Server.
   *
   * @param code - The Authorization Code from the social login provider.
   * @returns The request data for the Web3Auth Authentication Server.
   */
  generateAuthTokenRequestData(code: string): string {
    const { web3AuthNetwork } = this.options;
    const redirectUri = this.options.webAuthenticator.getRedirectURL();

    const requestData = {
      code,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      client_id: this.options.oAuthClientId,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      redirect_uri: redirectUri,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      login_provider: this.authConnection,
      network: web3AuthNetwork,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      code_verifier: this.codeVerifier,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_type: 'offline',
    };

    return JSON.stringify(requestData);
  }

  /**
   * Get the user's information from the JWT Token.
   *
   * @param idToken - The JWT Token from the Web3Auth Authentication Server.
   * @returns The user's information from the JWT Token.
   */
  async getUserInfo(idToken: string): Promise<OAuthUserInfo> {
    const jsonPayload = decodeIdToken(idToken);
    const payload = JSON.parse(jsonPayload);
    return {
      email: payload.email,
      sub: payload.sub,
    };
  }
}
