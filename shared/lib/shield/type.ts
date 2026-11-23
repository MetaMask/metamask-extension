/**
 * API base URLs for one Shield backend environment. URLs have no trailing
 * slash, and `subscriptionApiUrl` omits the `/v1` API version.
 */
export type ShieldEnvConfig = {
  subscriptionApiUrl: string;
  claimsApiUrl: string;
  shieldApiUrl: string;
  gatewayUrl: string;
};

export type ShieldSubscriptionError = {
  message: string;
  code?: string;
};
