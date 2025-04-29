import {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedMessenger,
} from '@metamask/base-controller';
import {
  Web3AuthNetwork,
  AuthConnection,
} from '@metamask-previews/seedless-onboarding-controller';

export const controllerName = 'OAuthController';

export type LoginHandlerOptions = {
  oAuthClientId: string;
  authServerUrl: string;
  web3AuthNetwork: Web3AuthNetwork;
  redirectUri: string;
  scopes?: string[];
  /**
   * The server redirect URI to use for the OAuth login.
   * This is the URI that the OAuth provider will redirect to after the user has logged in.
   * This is required for Apple login.
   */
  serverRedirectUri?: string;
};

/**
 * The state of the {@link OAuthController}
 */
export type OAuthControllerState = {
  // OAuth Controller is stateless
};

export type OAuthControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  OAuthControllerState
>;

export type OAuthControllerActions = OAuthControllerGetStateAction;

export type OAuthControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  OAuthControllerState
>;

export type OAuthControllerControllerEvents = OAuthControllerStateChangeEvent;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions = never;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents = never;

export type OAuthControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  OAuthControllerActions | AllowedActions,
  OAuthControllerControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

/**
 * The configuration to initiate the OAuth login and get the Authorization Code.
 *
 * - clientId: string - the client ID of the OAuth provider
 * - redirectUri: string - the redirect URI of the OAuth provider
 * - serverRedirectUri: string - the server redirect URI of the OAuth provider, to be used for Apple login
 * - scopes: string[] - the scopes of the OAuth provider
 */
export type OAuthProviderConfig = {
  clientId: string;
  redirectUri?: string;
  /** for apple, we need to redirect to a server endpoint that will handle the post request and redirect back to client */
  serverRedirectUri?: string;
  scopes?: string[];
};

export type OAuthLoginEnv = {
  authConnectionId: string;
  groupedAuthConnectionId: string;
  googleClientId: string;
  appleClientId: string;
  authServerUrl: string;
  web3AuthNetwork: Web3AuthNetwork;
  serverRedirectUri?: string;
};

export type OAuthControllerOptions = {
  messenger: OAuthControllerMessenger;

  /**
   * The environment variables required for the OAuth login and get JWT Token.
   */
  env: OAuthLoginEnv;
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
  success: boolean;
  message: string;
  /**
   * The JWT Tokens issued from the Web3Auth Authentication Server.
   * The key is the audience value and the value is the JWT Token.
   */
  jwt_tokens: Record<string, string>;
};

/**
 * The result of the OAuth login.
 *
 * This is the return value of the {@link OAuthController.startOAuthLogin} method.
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
};

/**
 * The user's information extracted from the JWT Token.
 */
export type OAuthUserInfo = {
  email: string;
  sub: string;
};
