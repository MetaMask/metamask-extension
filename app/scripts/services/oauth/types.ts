import {
  Web3AuthNetwork,
  AuthConnection,
} from '@metamask/seedless-onboarding-controller';
import { RestrictedMessenger } from '@metamask/base-controller';

export const SERVICE_NAME = 'OAuthService';

export type ServiceName = typeof SERVICE_NAME;

/**
 * Start the OAuth login process for the given social login type.
 */
export type OAuthServiceStartOAuthLoginAction = {
  type: `${ServiceName}:startOAuthLogin`;
  handler: (authConnection: AuthConnection) => Promise<OAuthLoginResult>;
};

/**
 * Get a new refresh token from the Web3Auth Authentication Server.
 */
export type OAuthServiceGetNewRefreshTokenAction = {
  type: `${ServiceName}:getNewRefreshToken`;
  handler: (options: {
    connection: AuthConnection;
    refreshToken: string;
  }) => Promise<OAuthRefreshTokenResult>;
};

/**
 * Revoke the current refresh token and get a new refresh token.
 */
export type OAuthServiceRevokeAndGetNewRefreshTokenAction = {
  type: `${ServiceName}:revokeAndGetNewRefreshToken`;
  handler: (options: {
    connection: AuthConnection;
    revokeToken: string;
  }) => Promise<{ newRevokeToken: string; newRefreshToken: string }>;
};

/**
 * All possible actions for the OAuthService.
 */
export type OAuthServiceAction =
  | OAuthServiceStartOAuthLoginAction
  | OAuthServiceGetNewRefreshTokenAction
  | OAuthServiceRevokeAndGetNewRefreshTokenAction;

/**
 * All possible events that the OAuthService can emit.
 */
export type OAuthServiceEvent = never;

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
  googleGroupedAuthConnectionId: string;
  appleAuthConnectionId: string;
  appleGroupedAuthConnectionId: string;
  authServerUrl: string;
  web3AuthNetwork: Web3AuthNetwork;
};

export type OAuthServiceOptions = {
  /**
   * The messenger used to communicate with other services and controllers.
   */
  messenger: RestrictedMessenger<
    typeof SERVICE_NAME,
    OAuthServiceAction,
    OAuthServiceEvent,
    OAuthServiceAction['type'],
    OAuthServiceEvent['type']
  >;

  /**
   * The environment variables required for the OAuth login and get JWT Token.
   */
  env: OAuthLoginEnv;

  /**
   * The WebAuthenticator to use for the OAuth login.
   */
  webAuthenticator: WebAuthenticator;

  /**
   * Buffered trace methods that handle consent checking
   */
  bufferedTrace: (
    request: Record<string, unknown>,
    fn?: (context?: unknown) => unknown,
  ) => unknown;
  bufferedEndTrace: (request: Record<string, unknown>) => void;
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  id_token: string;

  /**
   * The refresh token issued from the Web3Auth Authentication Server.
   * This is used to refresh the JWT Token.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  refresh_token: string;

  /**
   * The revoke token issued from the Web3Auth Authentication Server.
   * This is used to revoke the JWT Token.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  revoke_token: string;

  /**
   * The access token issued from the Web3Auth Authentication Server.
   * This token includes the user information (email, idToken, etc.)
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  access_token: string;

  /**
   * The metadata access token issued from the Web3Auth Authentication Server.
   * This is used to access the secret metadata store.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  metadata_access_token: string;

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
  accessToken: string;
  metadataAccessToken: string;
};

/**
 * The result of the OAuth refresh token.
 *
 * This is the return value of the {@link OAuthService.getNewRefreshToken} method.
 * It contains the JWT Tokens issued from the Web3Auth Authentication Server.
 */
export type OAuthRefreshTokenResult = Pick<
  OAuthLoginResult,
  'idTokens' | 'accessToken' | 'metadataAccessToken'
>;

/**
 * The user's information extracted from the JWT Token.
 */
export type OAuthUserInfo = {
  email: string;
  sub: string;
};
