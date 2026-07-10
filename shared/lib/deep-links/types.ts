import type { SignatureStatus } from './verify';

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
  /**
   * Internal route requiring interstitial page (unsigned/invalid signature).
   */
  Interstitial = 'interstitial',
}

/**
 * Represents the result of parsing a deferred deep link.
 */
export type DeferredDeepLinkRoute =
  | {
      /**
       * External URL that can be opened without showing the interstitial.
       * This can be because the signature is valid or because the route is in
       * the interstitial bypass list.
       */
      type: DeferredDeepLinkRouteType.Redirect;
      url: string;
    }
  | {
      /**
       * Internal app route that can be opened without showing the interstitial.
       * This can be because the signature is valid or because the route is in
       * the interstitial bypass list.
       */
      type: DeferredDeepLinkRouteType.Navigate;
      route: string;
      signature: SignatureStatus;
    }
  | {
      type: DeferredDeepLinkRouteType.Interstitial;
      /**
       * The URL path and query to pass to the interstitial page.
       * Format: /path?query (e.g., /buy?address=0x...)
       */
      urlPathAndQuery: string;
    }
  | null;
