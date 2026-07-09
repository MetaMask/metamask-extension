import {
  DEEP_LINK_INTERSTITIAL_BYPASS_ROUTE_PATHS,
  isDeepLinkRouteAllowedToBypassInterstitial,
} from './interstitial-bypass';
import { routes } from '.';

describe('deep link interstitial bypass routes', () => {
  it('includes the Extension routes matching mobile whitelisted actions', () => {
    expect([...DEEP_LINK_INTERSTITIAL_BYPASS_ROUTE_PATHS].sort()).toStrictEqual(
      [
        '/buy',
        '/batch-sell',
        '/card-onboarding',
        '/earn-musd',
        '/money',
        '/perps',
        '/perps-asset',
        '/perps-markets',
        '/predict',
        '/rewards',
        '/sell',
        '/shield',
        '/swap',
        '/trending',
      ].sort(),
    );
  });

  it('only includes routes registered in Extension', () => {
    for (const pathname of DEEP_LINK_INTERSTITIAL_BYPASS_ROUTE_PATHS) {
      expect(routes.has(pathname)).toBe(true);
    }
  });

  it('does not include supported routes that are not whitelisted on mobile', () => {
    expect(
      isDeepLinkRouteAllowedToBypassInterstitial(routes.get('/home')),
    ).toBe(false);
    expect(
      isDeepLinkRouteAllowedToBypassInterstitial(routes.get('/asset')),
    ).toBe(false);
    expect(
      isDeepLinkRouteAllowedToBypassInterstitial(routes.get('/notifications')),
    ).toBe(false);
    expect(
      isDeepLinkRouteAllowedToBypassInterstitial(routes.get('/onboarding')),
    ).toBe(false);
  });
});
