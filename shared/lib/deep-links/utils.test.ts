import log from 'loglevel';
import browser from 'webextension-polyfill';
import {
  getDeferredDeepLinkFromCookie,
  getDeferredDeepLinkRoute,
} from './utils';
import { DeferredDeepLinkRouteType } from './types';
import * as parseModule from './parse';

jest.mock('./parse');
jest.mock('webextension-polyfill');

const mockParse = parseModule.parse as jest.MockedFunction<
  typeof parseModule.parse
>;

const mockBuyLink =
  'https://link.metamask.io/buy?address=0xacA92E438df0B2401fF60dA7E4337B687a2435DA&amount=100&chainId=1&sig=aagQN9osZ1tfoYIEKvU6t5i8FVaW4Gi6EGimMcZ0VTDmAlPDk800-Nx3131QlDTmO3UF2JCmR2Y2RAJhceNOYw';
const mockSwapLink =
  'https://link.metamask.io/swap?amount=22000000000000000&from=eip155%3A1%2Fslip44%3A60&sig_params=amount%2Cfrom%2Cto&to=eip155%3A59144%2Ferc20%3A0x176211869cA2b568f2A7D4EE941E073a821EE1ff&sig=KYoYO9beWAlLIT6GUATcHj98hoDiO9h3UZC76ZcMfreKsJcFtCp_vJCWqa9s8-6aO4FLPgoMI02k03t2WcL5bA';

const mockBrowser = browser as jest.Mocked<typeof browser>;

describe('Deep link utils', () => {
  describe('getDeferredDeepLinkFromCookie', () => {
    let logErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      // @ts-expect-error: cookies need to be mocked
      mockBrowser.cookies = {
        get: jest.fn(),
      } as unknown;

      logErrorSpy = jest.spyOn(log, 'error').mockImplementation();
      jest.clearAllTimers();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns parsed cookie data', async () => {
      const mockData = {
        createdAt: 1234567890,
        referringLink: 'https://link.metamask.io/deep-link',
      };

      (mockBrowser.cookies.get as jest.Mock).mockResolvedValue({
        name: 'deferred_deeplink',
        value: JSON.stringify(mockData),
      });

      const result = await getDeferredDeepLinkFromCookie();

      expect(result).toStrictEqual(mockData);
      expect(mockBrowser.cookies.get).toHaveBeenCalledWith({
        url: 'https://metamask.io/',
        name: 'deferred_deeplink',
      });
    });

    it('returns null and log warning on invalid cookie data', async () => {
      (mockBrowser.cookies.get as jest.Mock).mockResolvedValue({
        name: 'deferred_deeplink',
        value: 'invalid json{',
      });

      const result = await getDeferredDeepLinkFromCookie();

      expect(result).toBeNull();
      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse deferred_deeplink cookie.'),
        expect.any(Error),
      );
    });

    describe('createdAt validation', () => {
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
        async (_description: unknown, invalidValue: unknown) => {
          const mockData = {
            createdAt: invalidValue,
            referringLink: 'https://link.metamask.io/deep-link',
          };

          (mockBrowser.cookies.get as jest.Mock).mockResolvedValue({
            name: 'deferred_deeplink',
            value: JSON.stringify(mockData),
          });

          const result = await getDeferredDeepLinkFromCookie();

          expect(result).toBeNull();
          expect(logErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Invalid createdAt'),
          );
        },
      );
    });

    it('resolves null after timeout if cookie promise never resolves', async () => {
      jest.useFakeTimers();

      (mockBrowser.cookies.get as jest.Mock).mockImplementation(
        () =>
          new Promise(() => {
            // intentionally never resolves
          }),
      );

      const resultPromise = getDeferredDeepLinkFromCookie();
      jest.advanceTimersByTime(5000);

      const result = await resultPromise;

      expect(result).toBeNull();
      expect(logErrorSpy).toHaveBeenCalledWith(
        'Timed out while trying to retrieve deferred deeplink cookie.',
      );

      jest.useRealTimers();
    });

    it('returns null when browser API throws an error in promise rejection', async () => {
      (mockBrowser.cookies.get as jest.Mock).mockRejectedValue(
        new Error('Browser API not available'),
      );

      const result = await getDeferredDeepLinkFromCookie();

      expect(result).toBeNull();
      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to retrieve cookie with browser API.'),
        expect.any(Error),
      );
    });

    it('returns null when browser API call itself throws synchronously', async () => {
      (mockBrowser.cookies.get as jest.Mock).mockImplementation(() => {
        throw new Error('Chrome API not available');
      });

      const result = await getDeferredDeepLinkFromCookie();

      expect(result).toBeNull();
      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to use browser API for deferred deep link cookies.',
        ),
        expect.any(Error),
      );
    });
  });

  describe('getDeferredDeepLinkRoute', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('when link is valid and not expired', () => {
      it('returns redirect route for external URL redirect', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: { redirectTo: new URL('https://app.metamask.io/buy') },
          signature: 'valid',
          route: {} as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockBuyLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Redirect,
          url: 'https://app.metamask.io/buy',
        });
      });

      it('returns navigate route for internal route', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: {
            path: '/swap',
            query: new URLSearchParams('amount=100'),
          },
          signature: 'valid',
          route: {} as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockSwapLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Navigate,
          route: '/swap?amount=100',
        });
      });

      it('returns redirect for link less than 2 hours old', async () => {
        const oneHourMs = 60 * 60 * 1000;
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + oneHourMs);

        mockParse.mockResolvedValue({
          destination: { redirectTo: new URL('https://app.metamask.io/buy') },
          signature: 'valid',
          route: {} as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockBuyLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Redirect,
          url: 'https://app.metamask.io/buy',
        });
      });

      it('returns navigate route for fresh link', async () => {
        const createdAt = Date.now();

        mockParse.mockResolvedValue({
          destination: {
            path: '/swap',
            query: new URLSearchParams('amount=50'),
          },
          signature: 'valid',
          route: {} as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockSwapLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Navigate,
          route: '/swap?amount=50',
        });
      });
    });

    describe('when referringLink is missing or invalid', () => {
      it('returns null when deferredDeepLink is null', async () => {
        const result = await getDeferredDeepLinkRoute(null as never);
        expect(result).toBeNull();
      });

      it('returns null when deferredDeepLink is undefined', async () => {
        const result = await getDeferredDeepLinkRoute(undefined as never);
        expect(result).toBeNull();
      });

      it('returns null when referringLink is null', async () => {
        const result = await getDeferredDeepLinkRoute({
          createdAt: Date.now(),
          referringLink: null as never,
        });
        expect(result).toBeNull();
      });

      it('returns null when referringLink is empty string', async () => {
        const result = await getDeferredDeepLinkRoute({
          createdAt: Date.now(),
          referringLink: '',
        });
        expect(result).toBeNull();
      });
    });

    describe('when link is older than two hours', () => {
      it('returns null when link is older than 2 hours', async () => {
        const twoHoursMs = 2 * 60 * 60 * 1000;
        const createdAt = 1000000;

        jest.setSystemTime(createdAt + twoHoursMs + 1000);

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockSwapLink,
        });

        expect(result).toBeNull();
      });
    });

    describe('when URL parsing fails', () => {
      it('returns null when referringLink is not a valid URL', async () => {
        const createdAt = 1000000;

        jest.setSystemTime(createdAt + 60 * 1000);

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: 'not-a-valid-url',
        });

        expect(result).toBeNull();
      });

      it('returns null when referringLink is malformed', async () => {
        const createdAt = 1000000;

        jest.setSystemTime(createdAt + 60 * 1000);

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: 'ht!tp://[invalid',
        });

        expect(result).toBeNull();
      });
    });
  });
});
