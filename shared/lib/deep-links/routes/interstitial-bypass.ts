import type { Route } from './route';

const deepLinkInterstitialBypassRoutePathList = [
  '/buy',
  '/sell',
  '/batch-sell',
  '/card-onboarding',
  '/swap',
  '/money',
  '/earn-musd',
  '/perps',
  '/perps-markets',
  '/perps-asset',
  '/rewards',
  '/predict',
  '/trending',
  '/shield',
] as const;

/**
 * Extension deep-link routes that follow mobile's whitelisted actions behavior
 * and bypass the interstitial regardless of signature status.
 *
 * `/asset` is intentionally excluded so CAIP-19 asset deep links still show the
 * phishing interstitial when Skip Interstitial is disabled (ASSETS-3689).
 *
 * This is intentionally scoped to routes that exist in Extension.
 */
export const DEEP_LINK_INTERSTITIAL_BYPASS_ROUTE_PATHS: ReadonlySet<
  Route['pathname']
> = new Set(deepLinkInterstitialBypassRoutePathList);

export function isDeepLinkRouteAllowedToBypassInterstitial(
  route?: Pick<Route, 'pathname'>,
): boolean {
  return Boolean(
    route && DEEP_LINK_INTERSTITIAL_BYPASS_ROUTE_PATHS.has(route.pathname),
  );
}
