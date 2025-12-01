import {
  getDeferredDeepLinkFromCookie,
  getDeferredDeepLinkRoute,
} from './utils';
import { DeferredDeepLinkRouteType } from './types';
import * as parseModule from './parse';

jest.mock('./parse');

const mockParse = parseModule.parse as jest.MockedFunction<
  typeof parseModule.parse
>;
const mockBuyLink =
  'https://link.metamask.io/buy?address=0xacA92E438df0B2401fF60dA7E4337B687a2435DA&amount=100&chainId=1&sig=aagQN9osZ1tfoYIEKvU6t5i8FVaW4Gi6EGimMcZ0VTDmAlPDk800-Nx3131QlDTmO3UF2JCmR2Y2RAJhceNOYw';
const mockSwapLink =
  'https://link.metamask.io/swap?amount=22000000000000000&from=eip155%3A1%2Fslip44%3A60&sig_params=amount%2Cfrom%2Cto&to=eip155%3A59144%2Ferc20%3A0x176211869cA2b568f2A7D4EE941E073a821EE1ff&sig=KYoYO9beWAlLIT6GUATcHj98hoDiO9h3UZC76ZcMfreKsJcFtCp_vJCWqa9s8-6aO4FLPgoMI02k03t2WcL5bA';

describe('Deep link utils', () => {
  describe('getDeferredDeepLinkFromCookie', () => {
    let mockChromeCookiesGet: jest.Mock;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      mockChromeCookiesGet = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).chrome = {
        cookies: {
          get: mockChromeCookiesGet,
        },
      };
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
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

      mockChromeCookiesGet.mockImplementation((_details, callback) => {
        // eslint-disable-next-line node/no-callback-literal
        callback({
          name: 'deferred_deeplink',
          value: JSON.stringify(mockData),
        });
      });

      const result = await getDeferredDeepLinkFromCookie();

      expect(result).toStrictEqual(mockData);
      expect(mockChromeCookiesGet).toHaveBeenCalledWith(
        { url: 'https://metamask.io/', name: 'deferred_deeplink' },
        expect.any(Function),
      );
    });

    it('returns null and log warning on invalid cookie data', async () => {
      mockChromeCookiesGet.mockImplementation((_details, callback) => {
        // eslint-disable-next-line node/no-callback-literal
        callback({
          name: 'deferred_deeplink',
          value: 'invalid json{',
        });
      });

      const result = await getDeferredDeepLinkFromCookie();

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse deferred_deeplink cookie:'),
      );
    });

    it('resolves null after timeout if cookie callback never returns anything', async () => {
      jest.useFakeTimers();

      mockChromeCookiesGet.mockImplementation(() => {
        // Intentionally don't call callback to simulate hanging
      });

      const resultPromise = getDeferredDeepLinkFromCookie();
      jest.advanceTimersByTime(5000);

      const result = await resultPromise;

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Timeout retrieving deferred deeplink cookie',
      );

      jest.useRealTimers();
    });

    it('returns null when chrome API throws an error', async () => {
      mockChromeCookiesGet.mockImplementation(() => {
        throw new Error('Chrome API not available');
      });

      const result = await getDeferredDeepLinkFromCookie();

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to use browser API for deferred deep link cookies:',
        ),
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
