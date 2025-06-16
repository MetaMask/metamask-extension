import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { LoginHandlerOptions, AuthTokenResponse, OAuthUserInfo } from './types';
import { padBase64String } from './utils';

export abstract class BaseLoginHandler {
  public options: LoginHandlerOptions;

  public nonce: string | undefined;

  // This prompt value is used to force the user to select an account before OAuth login
  protected readonly prompt = 'select_account';

  protected readonly CODE_CHALLENGE_METHOD = 'S256';

  constructor(options: LoginHandlerOptions) {
    this.options = options;
  }

  abstract get authConnection(): AuthConnection;

  abstract get scope(): string[];

  /**
   * Generate the Auth URL to initiate the OAuth login to get the Authorization Code.
   *
   * @returns The URL to initiate the OAuth login.
   */
  abstract getAuthUrl(): Promise<string>;

  /**
   * Get the JWT Token from the Web3Auth Authentication Server.
   *
   * @param code - The authorization code from the social login provider.
   * @returns The JWT Token from the Web3Auth Authentication Server.
   */
  abstract getAuthIdToken(code: string): Promise<AuthTokenResponse>;

  /**
   * Generate the request body data to get the JWT Token from the Web3Auth Authentication Server.
   *
   * @param code - The authorization code from the social login provider.
   * @returns The request data for the Web3Auth Authentication Server.
   */
  abstract generateAuthTokenRequestData(code: string): string;

  /**
   * Get the user's information from the JWT Token.
   *
   * @param idToken - The JWT Token from the Web3Auth Authentication Server.
   * @returns The user's information from the JWT Token.
   */
  abstract getUserInfo(idToken: string): Promise<OAuthUserInfo>;

  /**
   * Validate the state value from the OAuth login redirect URL.
   *
   * @param state - The state value from the OAuth login redirect URL.
   */
  validateState(state: unknown): void {
    if (typeof state !== 'string') {
      throw new Error('Invalid state');
    }

    const parsedState = JSON.parse(state);

    if (parsedState.nonce !== this.nonce) {
      throw new Error('Invalid state');
    }
  }

  /**
   * Refresh the JWT Token using the refresh token.
   *
   * @param refreshToken - The refresh token from the Web3Auth Authentication Server.
   * @returns The JWT Token from the Web3Auth Authentication Server and new refresh token.
   */
  async refreshAuthToken(
    refreshToken: string,
  ): Promise<Pick<AuthTokenResponse, 'jwt_tokens'>> {
    const { web3AuthNetwork } = this.options;
    const requestData = {
      client_id: this.options.oAuthClientId,
      login_provider: this.authConnection,
      network: web3AuthNetwork,
      refresh_token: refreshToken,
      grant_type: 'refresh_token', // specify refresh token flow
    };
    const res = await this.requestAuthToken(JSON.stringify(requestData));
    return res;
  }

  /**
   * Revoke the refresh token.
   *
   * @param revokeToken - The revoke token from the Web3Auth Authentication Server.
   */
  async revokeRefreshToken(revokeToken: string): Promise<{
    refresh_token: string;
    revoke_token: string;
  }> {
    const requestData = {
      revoke_token: revokeToken,
    };

    const res = await fetch(
      `${this.options.authServerUrl}/api/v1/oauth/revoke`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      },
    );

    const data = await res.json();
    return data;
  }

  /**
   * Make a request to the Web3Auth Authentication Server to get the JWT Token.
   *
   * @param requestData - The request data for the Web3Auth Authentication Server.
   * @returns The JWT Token from the Web3Auth Authentication Server.
   */
  protected async requestAuthToken(
    requestData: string,
  ): Promise<AuthTokenResponse> {
    const res = await fetch(
      `${this.options.authServerUrl}/api/v1/oauth/token`,
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
   * Decode the JWT Token to get the user's information.
   *
   * @param idToken - The JWT Token from the Web3Auth Authentication Server.
   * @returns The user's information from the JWT Token.
   */
  protected decodeIdToken(idToken: string): string {
    const [, idTokenPayload] = idToken.split('.');
    const base64String = padBase64String(idTokenPayload)
      .replace(/-/u, '+')
      .replace(/_/u, '/');
    // Using buffer here instead of atob because userinfo can contain emojis which are not supported by atob
    // the browser replacement for atob is https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64
    // which is not supported in all chrome yet
    return Buffer.from(base64String, 'base64').toString('utf-8');
  }

  /**
   * Generate a nonce value.
   *
   * @returns The nonce value.
   */
  protected generateNonce(): string {
    this.nonce = this.options.webAuthenticator.generateNonce();
    return this.nonce;
  }

  /**
   * Generate a code verifier and challenge value for PKCE flow.
   *
   * @returns The code verifier and challenge value.
   */
  protected generateCodeVerifierChallenge(): Promise<{
    codeVerifier: string;
    challenge: string;
  }> {
    return this.options.webAuthenticator.generateCodeVerifierAndChallenge();
  }
}
