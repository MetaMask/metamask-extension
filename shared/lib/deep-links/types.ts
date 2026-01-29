/**
 * Represents deferred deep link data retrieved from browser cookies.
 * This contains information about a deep link that should be used
 * to redirect the user after the wallet initialization is complete.
 */
export type DeferredDeepLink = {
  /**
   * Timestamp (in milliseconds) when the deep link was created.
   */
  createdAt: number;

  /**
   * The referring link URL to redirect to after onboarding.
   */
  referringLink: string;
};

/**
 * Type of deferred deep link route destination.
 */
export enum DeferredDeepLinkRouteType {
  /**
   * External URL redirect.
   */
  Redirect = 'redirect',
  /**
   * Internal app route.
   */
  Navigate = 'navigate',
}

/**
 * Represents the result of parsing a deferred deep link.
 */
export type DeferredDeepLinkRoute =
  | { type: DeferredDeepLinkRouteType.Redirect; url: string }
  | { type: DeferredDeepLinkRouteType.Navigate; route: string }
  | null;
