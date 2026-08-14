import log from 'loglevel';
import browser from 'webextension-polyfill';
import { MetaMetricsUserTrait } from '../constants/metametrics';
import {
  getInstallAttribution,
  getInstallAttributionFromCookies,
} from './install-attribution';

jest.mock('webextension-polyfill');

const mockBrowser = browser as jest.Mocked<typeof browser>;

describe('install attribution', () => {
  let logErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // @ts-expect-error: cookies need to be mocked
    mockBrowser.cookies = {
      getAll: jest.fn(),
    } as unknown;

    logErrorSpy = jest.spyOn(log, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInstallAttribution', () => {
    it('reads both install attribution cookies with a single browser call', async () => {
      const deferredDeepLink = {
        createdAt: 1234567890,
        referringLink: 'https://link.metamask.io/deep-link',
      };
      const gaCookieValue = 'GA1.1.12345.67890';

      (mockBrowser.cookies.getAll as jest.Mock).mockResolvedValue([
        {
          name: 'unrelated_cookie',
          value: 'ignore-me',
        },
        {
          name: 'deferred_deeplink',
          value: JSON.stringify(deferredDeepLink),
        },
        {
          name: '_ga',
          value: gaCookieValue,
        },
      ]);

      const result = await getInstallAttribution();

      expect(mockBrowser.cookies.getAll).toHaveBeenCalledTimes(1);
      expect(mockBrowser.cookies.getAll).toHaveBeenCalledWith({
        url: 'https://metamask.io/',
      });
      expect(result).toStrictEqual({
        deferredDeepLink,
        traits: {
          [MetaMetricsUserTrait.CookieId]: gaCookieValue,
          [MetaMetricsUserTrait.GaClientId]: '12345.67890',
        },
      });
    });

    it('returns empty attribution when no relevant cookies exist', async () => {
      (mockBrowser.cookies.getAll as jest.Mock).mockResolvedValue([]);

      await expect(getInstallAttribution()).resolves.toStrictEqual({
        deferredDeepLink: null,
        traits: {},
      });
    });

    it('returns empty attribution when the browser cookie API fails', async () => {
      (mockBrowser.cookies.getAll as jest.Mock).mockRejectedValue(
        new Error('Browser API not available'),
      );

      await expect(getInstallAttribution()).resolves.toStrictEqual({
        deferredDeepLink: null,
        traits: {},
      });
      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to use browser API for MetaMask install attribution cookies.',
        ),
        expect.any(Error),
      );
    });
  });

  describe('getInstallAttributionFromCookies', () => {
    it('continues parsing _ga traits when deferred deeplink cookie JSON is malformed', () => {
      const gaCookieValue = 'GA1.1.54321.98765';

      const result = getInstallAttributionFromCookies([
        {
          name: 'deferred_deeplink',
          value: 'invalid json{',
        },
        {
          name: '_ga',
          value: gaCookieValue,
        },
      ]);

      expect(result).toStrictEqual({
        deferredDeepLink: null,
        traits: {
          [MetaMetricsUserTrait.CookieId]: gaCookieValue,
          [MetaMetricsUserTrait.GaClientId]: '54321.98765',
        },
      });
      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse deferred_deeplink cookie.'),
        expect.any(Error),
      );
    });

    it('keeps cookie_id and omits ga_client_id when the _ga cookie is malformed', () => {
      const result = getInstallAttributionFromCookies([
        {
          name: '_ga',
          value: 'malformed-ga-cookie',
        },
      ]);

      expect(result).toStrictEqual({
        deferredDeepLink: null,
        traits: {
          [MetaMetricsUserTrait.CookieId]: 'malformed-ga-cookie',
        },
      });
      expect(logErrorSpy).toHaveBeenCalledWith('Invalid _ga cookie value.');
    });

    const invalidCreatedAtValues = [
      ['undefined', undefined],
      ['null', null],
      ['string', '1234567890'],
      ['NaN', NaN],
      ['Infinity', Infinity],
      ['-Infinity', -Infinity],
      ['object', { time: 1234567890 }],
      ['boolean', true],
      ['array', []],
    ];

    // @ts-expect-error '.each' is missing from type definitions
    it.each(invalidCreatedAtValues)(
      'returns null when createdAt is %s',
      (_description: unknown, invalidValue: unknown) => {
        const result = getInstallAttributionFromCookies([
          {
            name: 'deferred_deeplink',
            value: JSON.stringify({
              createdAt: invalidValue,
              referringLink: 'https://link.metamask.io/deep-link',
            }),
          },
        ]);

        expect(result).toStrictEqual({
          deferredDeepLink: null,
          traits: {},
        });
        expect(logErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid createdAt'),
        );
      },
    );

    it('returns the last two dot-separated sections', () => {
      const result = getInstallAttributionFromCookies([
        {
          name: '_ga',
          value: 'GA1.1.12345.67890',
        },
      ]);

      expect(result).toStrictEqual({
        deferredDeepLink: null,
        traits: {
          [MetaMetricsUserTrait.CookieId]: 'GA1.1.12345.67890',
          [MetaMetricsUserTrait.GaClientId]: '12345.67890',
        },
      });
    });

    it('returns null when the cookie value does not contain two non-empty sections', () => {
      expect(
        getInstallAttributionFromCookies([{ name: '_ga', value: 'GA1' }]),
      ).toStrictEqual({
        deferredDeepLink: null,
        traits: {
          [MetaMetricsUserTrait.CookieId]: 'GA1',
        },
      });
      expect(
        getInstallAttributionFromCookies([{ name: '_ga', value: 'GA1.' }]),
      ).toStrictEqual({
        deferredDeepLink: null,
        traits: {
          [MetaMetricsUserTrait.CookieId]: 'GA1.',
        },
      });
      expect(
        getInstallAttributionFromCookies([
          { name: '_ga', value: 'GA1..12345' },
        ]),
      ).toStrictEqual({
        deferredDeepLink: null,
        traits: {
          [MetaMetricsUserTrait.CookieId]: 'GA1..12345',
        },
      });
    });
  });
});
