/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { OAuthService } from './oauth-service';

/**
 * Start the OAuth login process for the given social login type.
 *
 * @param authConnection - The social login type to login with.
 * @param parentTraceContext - Optional serialized parent context for OAuth traces.
 * @returns The login result.
 */
export type OAuthServiceStartOAuthLoginAction = {
  type: `OAuthService:startOAuthLogin`;
  handler: OAuthService['startOAuthLogin'];
};

/**
 * Wait for the selected social login path's browser allowances before preload.
 * The login request sets this promise synchronously before its first await.
 */
export type OAuthServiceWaitForOnboardingNetworkPolicyAction = {
  type: `OAuthService:waitForOnboardingNetworkPolicy`;
  handler: OAuthService['waitForOnboardingNetworkPolicy'];
};

/**
 * Get a new refresh token from the Web3Auth Authentication Server.
 *
 * @param options - The options for the get new refresh token.
 * @param options.connection - The social login type to login with.
 * @param options.refreshToken - The refresh token to authenticate the refresh request.
 * @returns The new refresh token.
 */
export type OAuthServiceGetNewRefreshTokenAction = {
  type: `OAuthService:getNewRefreshToken`;
  handler: OAuthService['getNewRefreshToken'];
};

/**
 * Renew the refresh token - get a new refresh token and revoke token.
 *
 * @param options - The options for the revoke and get new refresh token.
 * @param options.connection - The social login type to login with.
 * @param options.revokeToken - The revoke token to authenticate the request.
 * @returns The new refresh token and revoke token.
 */
export type OAuthServiceRenewRefreshTokenAction = {
  type: `OAuthService:renewRefreshToken`;
  handler: OAuthService['renewRefreshToken'];
};

export type OAuthServiceRevokeRefreshTokenAction = {
  type: `OAuthService:revokeRefreshToken`;
  handler: OAuthService['revokeRefreshToken'];
};

export type OAuthServiceSetMarketingConsentAction = {
  type: `OAuthService:setMarketingConsent`;
  handler: OAuthService['setMarketingConsent'];
};

export type OAuthServiceGetMarketingConsentAction = {
  type: `OAuthService:getMarketingConsent`;
  handler: OAuthService['getMarketingConsent'];
};

/**
 * Union of all OAuthService action types.
 */
export type OAuthServiceMethodActions =
  | OAuthServiceStartOAuthLoginAction
  | OAuthServiceWaitForOnboardingNetworkPolicyAction
  | OAuthServiceGetNewRefreshTokenAction
  | OAuthServiceRenewRefreshTokenAction
  | OAuthServiceRevokeRefreshTokenAction
  | OAuthServiceSetMarketingConsentAction
  | OAuthServiceGetMarketingConsentAction;
