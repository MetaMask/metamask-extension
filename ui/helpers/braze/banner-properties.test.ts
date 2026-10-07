/* eslint-disable @typescript-eslint/naming-convention -- Braze campaign property contract. */
import type { Banner } from '@braze/web-sdk';
import {
  getBrazeBannerContent,
  getBrazeBannerEventProperties,
} from './banner-properties';

describe('banner properties', () => {
  const makeBanner = (
    properties: Record<string, string>,
    image: string | null = null,
  ) =>
    ({
      getStringProperty: (key: string) => properties[key] ?? null,
      getImageProperty: () => image,
    }) as unknown as Banner;

  it('uses typed web accessors including image-type campaign properties', () => {
    const banner = makeBanner(
      { body: 'Hello', image_url: 'fallback' },
      'https://example.com/image.png',
    );
    expect(getBrazeBannerContent(banner)).toMatchObject({
      body: 'Hello',
      title: null,
      imageUrl: 'https://example.com/image.png',
    });
  });

  it('falls back to string image properties', () => {
    expect(
      getBrazeBannerContent(
        makeBanner({ image_url: 'https://example.com/image.png' }),
      ).imageUrl,
    ).toBe('https://example.com/image.png');
  });

  it('omits targeting events without a campaign name', () => {
    expect(
      getBrazeBannerEventProperties(makeBanner({ variant_name: 'A' })),
    ).toBeNull();
  });

  it('uses the mobile campaign metadata contract', () => {
    expect(
      getBrazeBannerEventProperties(
        makeBanner({ campaign_name: 'Welcome', variant_name: 'A' }),
      ),
    ).toStrictEqual({ campaign_name: 'Welcome', variant_name: 'A' });
  });
});
