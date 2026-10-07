/* eslint-disable @typescript-eslint/naming-convention -- Braze campaign property contract. */
import * as braze from '@braze/web-sdk';
import {
  dismissBrazeBanner,
  logBrazeBannerImpression,
} from './banner-analytics';

describe('banner analytics', () => {
  const banner = {
    placementId: 'extension-wallet-home',
    getStringProperty: (key: string) =>
      key === 'campaign_name' ? 'Welcome' : null,
    getImageProperty: () => null,
  } as unknown as braze.Banner;

  beforeEach(() => jest.clearAllMocks());

  it('logs impressions with placement IDs rather than banner objects', () => {
    logBrazeBannerImpression(banner);
    expect(braze.logBannerImpressions).toHaveBeenCalledWith([
      'extension-wallet-home',
    ]);
    expect(braze.logCustomEvent).toHaveBeenCalledWith('Banner Display', {
      campaign_name: 'Welcome',
    });
  });

  it('delegates cache removal and persistence to the SDK', () => {
    dismissBrazeBanner(banner);
    expect(braze.dismissBanner).toHaveBeenCalledWith(banner);
    expect(braze.logCustomEvent).toHaveBeenCalledWith('Banner Dismissed', {
      campaign_name: 'Welcome',
    });
    expect(braze.requestImmediateDataFlush).toHaveBeenCalledTimes(1);
  });

  it('dismisses unnamed campaigns without a custom targeting event', () => {
    const unnamed = {
      ...banner,
      getStringProperty: () => null,
    } as unknown as braze.Banner;
    dismissBrazeBanner(unnamed);
    expect(braze.dismissBanner).toHaveBeenCalledWith(unnamed);
    expect(braze.logCustomEvent).not.toHaveBeenCalled();
  });
});
