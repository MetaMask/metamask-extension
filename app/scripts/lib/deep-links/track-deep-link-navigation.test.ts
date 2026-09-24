import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import type { ParsedDeepLink } from '../../../../shared/lib/deep-links/parse';
import { Route } from '../../../../shared/lib/deep-links/routes/route';
import { MISSING } from '../../../../shared/lib/deep-links/verify';
import { trackDeepLinkNavigation } from './track-deep-link-navigation';

const route = new Route({
  getTitle: () => 'Test',
  handler: () => ({ path: '/test', query: new URLSearchParams() }),
  pathname: '/test',
});

function createParsedDeepLink(trackContinuity: boolean): ParsedDeepLink {
  return {
    destination: {
      path: '/test',
      query: new URLSearchParams(),
      trackContinuity,
    },
    route,
    signature: MISSING,
  };
}

describe('trackDeepLinkNavigation', () => {
  const url = new URL('https://link.metamask.io/test');

  it('does not track when analytics are disabled', () => {
    const setContinuityIdForTab = jest.fn();
    const trackEvent = jest.fn();

    trackDeepLinkNavigation({
      canSubmitAnalytics: () => false,
      parsed: createParsedDeepLink(true),
      setContinuityIdForTab,
      tabId: 123,
      trackEvent,
      url,
    });

    expect(setContinuityIdForTab).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('tracks without a continuity ID when continuity is disabled', () => {
    const setContinuityIdForTab = jest.fn();
    const trackEvent = jest.fn();

    trackDeepLinkNavigation({
      canSubmitAnalytics: () => true,
      parsed: createParsedDeepLink(false),
      setContinuityIdForTab,
      tabId: 123,
      trackEvent,
      url,
    });

    expect(setContinuityIdForTab).not.toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.DeepLinkUsed,
        properties: expect.not.objectContaining({
          continuityId: expect.anything(),
        }),
      }),
    );
  });

  it('tracks with the tab continuity ID when continuity is enabled', () => {
    const setContinuityIdForTab = jest.fn().mockReturnValue('continuity-id');
    const trackEvent = jest.fn();

    trackDeepLinkNavigation({
      canSubmitAnalytics: () => true,
      parsed: createParsedDeepLink(true),
      setContinuityIdForTab,
      tabId: 123,
      trackEvent,
      url,
    });

    expect(setContinuityIdForTab).toHaveBeenCalledWith(123);
    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.DeepLinkUsed,
        properties: expect.objectContaining({
          continuityId: 'continuity-id',
        }),
      }),
    );
  });
});
