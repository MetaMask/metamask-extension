import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { BaseLoginHandler } from './base-login-handler';
import { AuthTokenResponse, LoginHandlerOptions, OAuthUserInfo } from './types';

export class AppleLoginHandler extends BaseLoginHandler {
  public readonly OAUTH_SERVER_URL = 'https://appleid.apple.com/auth/authorize';

  readonly #scope = ['name', 'email'];

  protected serverRedirectUri: string;

  constructor(options: LoginHandlerOptions) {
    super(options);

    if (options.serverRedirectUri) {
      this.serverRedirectUri = options.serverRedirectUri;
    } else {
      this.serverRedirectUri = `${options.authServerUrl}/api/v1/oauth/callback`;
    }
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

    const nonce = this.generateNonce();

    authUrl.searchParams.set('client_id', this.options.oAuthClientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', this.serverRedirectUri);
    authUrl.searchParams.set('response_mode', 'form_post');
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('prompt', this.prompt);
    authUrl.searchParams.set(
      'state',
      JSON.stringify({
        client_redirect_back_uri: this.options.redirectUri,
        nonce,
      }),
    );
    authUrl.searchParams.set('scope', this.#scope.join(' '));

    return Promise.resolve(authUrl.toString());
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
    const requestData = {
      code,
      client_id: this.options.oAuthClientId,
      redirect_uri: this.serverRedirectUri,
      login_provider: this.authConnection,
      network: web3AuthNetwork,
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
    const jsonPayload = this.decodeIdToken(idToken);
    const payload = JSON.parse(jsonPayload);
    return {
      email: payload.email,
      sub: payload.sub,
    };
  }
}
