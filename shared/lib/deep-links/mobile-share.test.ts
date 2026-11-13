import { it as jestIt } from '@jest/globals';
import { getMobileShareUrl } from './mobile-share';

describe('getMobileShareUrl', () => {
  jestIt.each(['link.metamask.io', 'link.metamask.com'])(
    'shares an unmatched route on %s without its share parameter',
    (host) => {
      expect(
        getMobileShareUrl(new URL(`https://${host}/mobile-only?share=1`)),
      ).toBe(`https://${host}/mobile-only`);
    },
  );

  it('preserves the original path, query encoding, repeated parameters, signature, and fragment', () => {
    const originalUrl =
      'https://link.metamask.com/Mobile/Only?name=hello%20world&share=1&value=%2f&value=two&sig=abc%2Bdef#details';
    const url = new URL(originalUrl);
    expect(getMobileShareUrl(url)).toBe(
      'https://link.metamask.com/Mobile/Only?name=hello%20world&value=%2f&value=two&sig=abc%2Bdef#details',
    );
    expect(url.href).toBe(originalUrl);
  });

  it('removes every share=1 including encoded values and preserves other share values', () => {
    expect(
      getMobileShareUrl(
        new URL(
          'https://link.metamask.io/mobile-only?share=0&share=1&sh%61re=%31&share=2',
        ),
      ),
    ).toBe('https://link.metamask.io/mobile-only?share=0&share=2');
  });

  jestIt.each([
    'https://link.metamask.io/mobile-only',
    'https://link.metamask.io/mobile-only?share=0',
    'https://link.metamask.io/mobile-only?share=true',
    'https://link.metamask.io/mobile-only?share=01',
    'https://link.metamask.io/home?share=1',
    'https://link.metamask.io/HOME?share=1',
    'https://link.metamask.io/swap?share=1',
  ])('does not handle %s', (url) => {
    expect(getMobileShareUrl(new URL(url))).toBeNull();
  });
});
