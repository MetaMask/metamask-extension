import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { BaseLoginHandler } from './base-login-handler';
import { AuthTokenResponse, LoginHandlerOptions, OAuthUserInfo } from './types';
import { decodeIdToken } from './utils';

export class AppleLoginHandler extends BaseLoginHandler {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly OAUTH_SERVER_URL: string;

  readonly #scope = ['name', 'email'];

  protected serverRedirectUri: string;

  constructor(options: LoginHandlerOptions) {
    super(options);

    this.serverRedirectUri = `${options.authServerUrl}/api/v1/oauth/callback`;

    // since Apple doesn't support PKCE,
    // we will use BFF (backend for frontend) to redirect to apple oauth server
    this.OAUTH_SERVER_URL = `${options.authServerUrl}/api/v1/oauth/initiate`;
  }

  get authConnection() {
    return AuthConnection.Apple;
  }

  get scope() {
    return this.#scope;
  }

  /**
   * Generate the Auth URL to initiate the OAuth login to get the Authorization Code from Apple ID server.
   *
   * @returns The URL to initiate the OAuth login.
   */
  async getAuthUrl(): Promise<string> {
    const authUrl = new URL(this.OAUTH_SERVER_URL);

    const redirectUri = this.options.webAuthenticator.getRedirectURL();
    const nonce = this.generateNonce();
    const { challenge } = await this.generateCodeVerifierChallenge();

    authUrl.searchParams.set('client_id', this.options.oAuthClientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_mode', 'form_post');
    authUrl.searchParams.set('prompt', this.prompt);
    authUrl.searchParams.set(
      'state',
      JSON.stringify({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        client_redirect_back_uri:
          this.options.webAuthenticator.getRedirectURL(),
        nonce,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        code_challenge: challenge,
      }),
    );
    authUrl.searchParams.set('scope', this.#scope.join(' '));

    return Promise.resolve(authUrl.toString());
  }

  /**
   * Get the JWT Token from the Web3Auth Authentication Server.
   *
   * @returns The JWT Token from the Web3Auth Authentication Server.
   */
  async getAuthIdToken(): Promise<AuthTokenResponse> {
    const requestData = this.generateAuthTokenRequestData();
    const res = await this.requestVerifyAuthToken(requestData);
    return res;
  }

  /**
   * Generate the request body data to get the JWT Token from the Web3Auth Authentication Server.
   *
   * @returns The request data for the Web3Auth Authentication Server.
   */
  generateAuthTokenRequestData(): string {
    const { web3AuthNetwork } = this.options;
    const requestData = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      code_verifier: this.codeVerifier,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      client_id: this.options.oAuthClientId,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      redirect_uri: this.serverRedirectUri,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      login_provider: this.authConnection,
      network: web3AuthNetwork,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_type: 'offline',
    };

    return JSON.stringify(requestData);
  }

  async requestVerifyAuthToken(
    requestData: string,
  ): Promise<AuthTokenResponse> {
    const res = await fetch(
      `${this.options.authServerUrl}/api/v1/oauth/callback/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestData,
      },
    );

    const data = await res.json();
    return data;
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
