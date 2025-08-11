import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { OAuthErrorMessages } from '../../../../shared/modules/error';
import { LoginHandlerOptions, AuthTokenResponse, OAuthUserInfo } from './types';

export abstract class BaseLoginHandler {
  public options: LoginHandlerOptions;

  public codeVerifier: string | undefined;

  // For the verification of the state (in the client side)
  public nonce: string | undefined;

  // This prompt value is used to force the user to select an account before OAuth login
  protected readonly prompt = 'select_account';

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly CODE_CHALLENGE_METHOD = 'S256';

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly AUTH_SERVER_TOKEN_PATH = '/api/v1/oauth/token';

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly AUTH_SERVER_REVOKE_PATH = '/api/v1/oauth/revoke';

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
  abstract getAuthIdToken(code?: string | null): Promise<AuthTokenResponse>;

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
   * @param url - The OAuth login redirect URL.
   */
  validateState(url: string): void {
    const urlObj = new URL(url);
    const state = urlObj.searchParams.get('state');

    if (typeof state !== 'string') {
      throw new Error(OAuthErrorMessages.INVALID_OAUTH_STATE_ERROR);
    }

    const parsedState = JSON.parse(state);

    if (parsedState.nonce !== this.nonce) {
      throw new Error(OAuthErrorMessages.INVALID_OAUTH_STATE_ERROR);
    }
  }

  /**
   * Refresh the JWT Token using the refresh token.
   *
   * @param refreshToken - The refresh token from the Web3Auth Authentication Server.
   * @returns The JWT Token from the Web3Auth Authentication Server and new refresh token.
   */
  async refreshAuthToken(refreshToken: string): Promise<AuthTokenResponse> {
    const { web3AuthNetwork } = this.options;
    const requestData = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      client_id: this.options.oAuthClientId,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      login_provider: this.authConnection,
      network: web3AuthNetwork,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      refresh_token: refreshToken,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    refresh_token: string;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    revoke_token: string;
  }> {
    const requestData = {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      revoke_token: revokeToken,
    };

    const res = await fetch(
      `${this.options.authServerUrl}${this.AUTH_SERVER_REVOKE_PATH}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      },
    );

    if (!res.ok) {
      throw new Error('Failed to revoke refresh token');
    }

    const data = await res.json();
    return {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      refresh_token: data.refresh_token,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      revoke_token: data.revoke_token,
    };
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
      `${this.options.authServerUrl}${this.AUTH_SERVER_TOKEN_PATH}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestData,
      },
    );

    if (!res.ok) {
      throw new Error('Failed to get auth token');
    }

    const data = await res.json();
    return data;
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
  protected async generateCodeVerifierChallenge(): Promise<{
    codeVerifier: string;
    challenge: string;
  }> {
    const { codeVerifier, challenge } =
      await this.options.webAuthenticator.generateCodeVerifierAndChallenge();
    this.codeVerifier = codeVerifier;
    return { codeVerifier, challenge };
  }
}
