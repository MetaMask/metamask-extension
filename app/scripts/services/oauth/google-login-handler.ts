import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { BaseLoginHandler } from './base-login-handler';
import { AuthTokenResponse, OAuthUserInfo } from './types';

export class GoogleLoginHandler extends BaseLoginHandler {
  public readonly OAUTH_SERVER_URL =
    'https://accounts.google.com/o/oauth2/v2/auth';

  readonly #scope = ['profile', 'email'];

  #codeVerifier: string | undefined;

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

    const { codeVerifier, challenge } =
      await this.generateCodeVerifierChallenge();
    const nonce = this.generateNonce();
    this.#codeVerifier = codeVerifier;

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
    authUrl.searchParams.set('redirect_uri', this.options.redirectUri);
    authUrl.searchParams.set('nonce', nonce);
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
    const { redirectUri, web3AuthNetwork } = this.options;
    const requestData = {
      code,
      client_id: this.options.oAuthClientId,
      redirect_uri: redirectUri,
      login_provider: this.authConnection,
      network: web3AuthNetwork,
      code_verifier: this.#codeVerifier,
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
