/* eslint-disable no-script-url -- Exercises rejection of unsafe campaign links. */
/* eslint-disable @typescript-eslint/naming-convention -- Braze campaign properties are snake_case. */
import { it } from '@jest/globals';
import {
  getBrazeBannerEventProperties,
  isAllowedBrazeBannerLink,
  toBrazeBanner,
} from './braze-banner';
import type { BrazeSdkBanner } from './braze-sdk';

const createBanner = ({
  isControl = false,
  strings = {},
  images = {},
}: {
  isControl?: boolean;
  strings?: Record<string, string>;
  images?: Record<string, string>;
}) =>
  ({
    id: 'banner-1',
    placementId: 'extension-wallet-home',
    isControl,
    html: '<div>ignored</div>',
    getStringProperty: (key: string) => strings[key] ?? null,
    getImageProperty: (key: string) => images[key] ?? null,
  }) as unknown as BrazeSdkBanner;

describe('isAllowedBrazeBannerLink', () => {
  it.each(['https://link.metamask.io/swap', 'https://link.metamask.com/home'])(
    'allows the MetaMask universal link %s',
    (href) => {
      expect(isAllowedBrazeBannerLink(href)).toBe(true);
    },
  );

  it.each([
    'http://link.metamask.io/swap',
    'https://example.com',
    'https://link.metamask.io.example.com/swap',
    'https://user:pass@link.metamask.io/swap',
    'https://link.metamask.io:8443/swap',
    'metamask://swap',
    'javascript:alert(1)',
    'not a url',
  ])('rejects %s', (href) => {
    expect(isAllowedBrazeBannerLink(href)).toBe(false);
  });
});

describe('toBrazeBanner', () => {
  it('returns null without a banner', () => {
    expect(toBrazeBanner(null)).toBeNull();
    expect(toBrazeBanner(undefined)).toBeNull();
  });

  it('reads the campaign properties, without the HTML', () => {
    expect(
      toBrazeBanner(
        createBanner({
          strings: {
            title: ' Welcome ',
            body: ' Explore your wallet ',
            cta_label: 'Learn more',
            deeplink: 'https://link.metamask.io/swap',
          },
          images: { image_url: 'https://example.com/image.png' },
        }),
      ),
    ).toStrictEqual({
      id: 'banner-1',
      placementId: 'extension-wallet-home',
      isControl: false,
      title: 'Welcome',
      body: 'Explore your wallet',
      imageUrl: 'https://example.com/image.png',
      ctaLabel: 'Learn more',
      deeplink: 'https://link.metamask.io/swap',
    });
  });

  it('accepts an image URL set as a string property', () => {
    expect(
      toBrazeBanner(
        createBanner({
          strings: { body: 'Body', image_url: 'https://example.com/a.png' },
        }),
      )?.imageUrl,
    ).toBe('https://example.com/a.png');
  });

  it.each(['', '   '])('returns null for the body %j', (body) => {
    expect(toBrazeBanner(createBanner({ strings: { body } }))).toBeNull();
  });

  it.each(['http://example.com/image.png', 'javascript:alert(1)', 'invalid'])(
    'drops the image %s',
    (imageUrl) => {
      expect(
        toBrazeBanner(
          createBanner({
            strings: { body: 'Body' },
            images: { image_url: imageUrl },
          }),
        )?.imageUrl,
      ).toBeNull();
    },
  );

  it('drops a link that is not a MetaMask universal link', () => {
    expect(
      toBrazeBanner(
        createBanner({
          strings: { body: 'Body', deeplink: 'https://example.com' },
        }),
      )?.deeplink,
    ).toBeNull();
  });

  it('returns a control banner without content', () => {
    expect(
      toBrazeBanner(
        createBanner({ isControl: true, strings: { body: 'Body' } }),
      ),
    ).toStrictEqual({
      id: 'banner-1',
      placementId: 'extension-wallet-home',
      isControl: true,
      title: null,
      body: null,
      imageUrl: null,
      ctaLabel: null,
      deeplink: null,
    });
  });
});

describe('getBrazeBannerEventProperties', () => {
  it('returns the campaign and variant names', () => {
    expect(
      getBrazeBannerEventProperties(
        createBanner({
          strings: { campaign_name: 'spring', variant_name: 'a' },
        }),
      ),
    ).toStrictEqual({ campaign_name: 'spring', variant_name: 'a' });
  });

  it('omits a missing variant name', () => {
    expect(
      getBrazeBannerEventProperties(
        createBanner({ strings: { campaign_name: 'spring' } }),
      ),
    ).toStrictEqual({ campaign_name: 'spring' });
  });

  it('returns undefined without a campaign name', () => {
    expect(
      getBrazeBannerEventProperties(
        createBanner({ strings: { variant_name: 'a' } }),
      ),
    ).toBeUndefined();
  });
});
