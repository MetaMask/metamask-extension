import {
  Web3AuthNetwork,
  AuthConnection,
} from '@metamask/seedless-onboarding-controller';

export const SERVICE_NAME = 'OAuthService';

/**
 * The WebAuthenticator is a type that defines the methods for the Web Authenticator API to launch the OAuth2 login flow.
 * It is used to abstract the Web Authenticator API from the OAuthService.
 */
export type WebAuthenticator = {
  /**
   * Get the redirect URL for the OAuth login.
   *
   * @returns The redirect URL for the OAuth login.
   */
  getRedirectURL: () => string;

  /**
   * Launch the oauth2 web flow to get the Authorization Code from the social login provider.
   *
   * @param options - The options for the web auth flow.
   * @returns The redirect URL from the social login provider.
   */
  launchWebAuthFlow: (
    options: {
      /** The URL that initiates the auth flow. */
      url: string;
      /**
       * Optional.
       * Whether to launch auth flow in interactive mode.
       * Since some auth flows may immediately redirect to a result URL, launchWebAuthFlow hides its web view until the first navigation either redirects to the final URL, or finishes loading a page meant to be displayed.
       * If the interactive flag is true, the window will be displayed when a page load completes. If the flag is false or omitted, launchWebAuthFlow will return with an error if the initial navigation does not complete the flow.
       */
      interactive?: boolean;
    },
    /**
     * The callback function to handle the response from the social login provider.
     *
     * @param responseUrl - The redirect URL from the social login provider.
     */
    callback: (responseUrl?: string) => void,
  ) => Promise<string | null | void>;

  /**
   * Generate a code verifier challenge for the OAuth login PKCE flow.
   *
   * @returns The code verifier challenge string.
   */
  generateCodeVerifierAndChallenge: () => Promise<{
    codeVerifier: string;
    challenge: string;
  }>;

  /**
   * Generate a nonce for the OAuth login.
   *
   * @returns The nonce string.
   */
  generateNonce: () => string;
};

export type LoginHandlerOptions = {
  oAuthClientId: string;
  authServerUrl: string;
  web3AuthNetwork: Web3AuthNetwork;
  webAuthenticator: WebAuthenticator;
  scopes?: string[];
};

export type OAuthLoginEnv = {
  /**
   * The Google Client ID for the OAuth login.
   */
  googleClientId: string;

  /**
   * The Apple Client ID for the OAuth login.
   */
  appleClientId: string;
};

export type OAuthConfig = {
  googleAuthConnectionId: string;
  googleGrouppedAuthConnectionId: string;
  appleAuthConnectionId: string;
  appleGrouppedAuthConnectionId: string;
  authServerUrl: string;
  web3AuthNetwork: Web3AuthNetwork;
};

export type OAuthServiceOptions = {
  /**
   * The environment variables required for the OAuth login and get JWT Token.
   */
  env: OAuthLoginEnv;

  /**
   * The WebAuthenticator to use for the OAuth login.
   */
  webAuthenticator: WebAuthenticator;
};

/**
 * The response from the Web3Auth Authentication Server to get the JWT Token.
 *
 * The response is a JSON object with the following properties:
 * - success: boolean - whether the request was successful
 * - message: string - the message from the Web3Auth Authentication Server
 * - jwt_tokens: Record<string, string> - the JWT Tokens issued from the Web3Auth Authentication Server
 */
export type AuthTokenResponse = {
  id_token: string;

  /**
   * The refresh token issued from the Web3Auth Authentication Server.
   * This is used to refresh the JWT Token.
   */
  refresh_token: string;

  /**
   * The revoke token issued from the Web3Auth Authentication Server.
   * This is used to revoke the JWT Token.
   */
  revoke_token: string;
  indexes: number[];
  endpoints: Record<string, string>;
};

/**
 * The result of the OAuth login.
 *
 * This is the return value of the {@link OAuthService.startOAuthLogin} method.
 * It contains the user's information and the JWT Tokens issued from the Web3Auth Authentication Server.
 *
 * - authConnection: AuthConnection - the social login type
 * - authConnectionId: string - the ID of the social login type
 * - groupedAuthConnectionId: string - the ID of the grouped social login type
 * - userId: string - the user's ID
 * - idTokens: string[] - the JWT Tokens issued from the Web3Auth Authentication Server
 * - socialLoginEmail: string - the email of the user
 */
export type OAuthLoginResult = {
  authConnection: AuthConnection;
  authConnectionId: string;
  groupedAuthConnectionId: string;
  userId: string;
  idTokens: string[];
  socialLoginEmail: string;
  refreshToken: string;
  revokeToken: string;
};

/**
 * The user's information extracted from the JWT Token.
 */
export type OAuthUserInfo = {
  email: string;
  sub: string;
};
