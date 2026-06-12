import { getDeferredDeepLinkRoute, buildInterstitialRoute } from './utils';
import { DeferredDeepLinkRouteType } from './types';
import * as parseModule from './parse';
import { VALID, MISSING, INVALID } from './verify';

jest.mock('./parse');

const mockParse = parseModule.parse as jest.MockedFunction<
  typeof parseModule.parse
>;

const mockBuyLink =
  'https://link.metamask.io/buy?address=0xacA92E438df0B2401fF60dA7E4337B687a2435DA&amount=100&chainId=1&sig=aagQN9osZ1tfoYIEKvU6t5i8FVaW4Gi6EGimMcZ0VTDmAlPDk800-Nx3131QlDTmO3UF2JCmR2Y2RAJhceNOYw';
const mockSwapLink =
  'https://link.metamask.io/swap?amount=22000000000000000&from=eip155%3A1%2Fslip44%3A60&sig_params=amount%2Cfrom%2Cto&to=eip155%3A59144%2Ferc20%3A0x176211869cA2b568f2A7D4EE941E073a821EE1ff&sig=KYoYO9beWAlLIT6GUATcHj98hoDiO9h3UZC76ZcMfreKsJcFtCp_vJCWqa9s8-6aO4FLPgoMI02k03t2WcL5bA';

describe('Deep link utils', () => {
  describe('buildInterstitialRoute', () => {
    it('builds the interstitial route with url path and query', () => {
      const result = buildInterstitialRoute('/swap?amount=100');
      expect(result).toBe('/link?u=%2Fswap%3Famount%3D100');
    });

    it('handles path without query parameters', () => {
      const result = buildInterstitialRoute('/swap');
      expect(result).toBe('/link?u=%2Fswap');
    });

    it('handles complex query parameters', () => {
      const result = buildInterstitialRoute(
        '/buy?address=0xacA92E438df0B2401fF60dA7E4337B687a2435DA&amount=100&chainId=1',
      );
      expect(result).toBe(
        '/link?u=%2Fbuy%3Faddress%3D0xacA92E438df0B2401fF60dA7E4337B687a2435DA%26amount%3D100%26chainId%3D1',
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
          signature: VALID,
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

      it('returns navigate route for internal route with valid signature', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: {
            path: '/swap',
            query: new URLSearchParams('amount=100'),
          },
          signature: VALID,
          route: {} as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockSwapLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Navigate,
          route: '/swap?amount=100',
          signature: VALID,
        });
      });

      it('returns redirect for link less than 2 hours old', async () => {
        const oneHourMs = 60 * 60 * 1000;
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + oneHourMs);

        mockParse.mockResolvedValue({
          destination: { redirectTo: new URL('https://app.metamask.io/buy') },
          signature: VALID,
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

      it('returns navigate route for fresh link with valid signature', async () => {
        const createdAt = Date.now();

        mockParse.mockResolvedValue({
          destination: {
            path: '/swap',
            query: new URLSearchParams('amount=50'),
          },
          signature: VALID,
          route: {} as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockSwapLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Navigate,
          route: '/swap?amount=50',
          signature: VALID,
        });
      });
    });

    describe('when signature is missing or invalid', () => {
      it('returns interstitial route for unsigned link', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: {
            path: '/swap',
            query: new URLSearchParams('amount=100'),
          },
          signature: MISSING,
          route: {} as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockSwapLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Interstitial,
          urlPathAndQuery:
            '/swap?amount=22000000000000000&from=eip155%3A1%2Fslip44%3A60&sig_params=amount%2Cfrom%2Cto&to=eip155%3A59144%2Ferc20%3A0x176211869cA2b568f2A7D4EE941E073a821EE1ff&sig=KYoYO9beWAlLIT6GUATcHj98hoDiO9h3UZC76ZcMfreKsJcFtCp_vJCWqa9s8-6aO4FLPgoMI02k03t2WcL5bA',
        });
      });

      it('returns interstitial route for link with invalid signature', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: {
            path: '/swap',
            query: new URLSearchParams('amount=100'),
          },
          signature: INVALID,
          route: {} as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockSwapLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Interstitial,
          urlPathAndQuery:
            '/swap?amount=22000000000000000&from=eip155%3A1%2Fslip44%3A60&sig_params=amount%2Cfrom%2Cto&to=eip155%3A59144%2Ferc20%3A0x176211869cA2b568f2A7D4EE941E073a821EE1ff&sig=KYoYO9beWAlLIT6GUATcHj98hoDiO9h3UZC76ZcMfreKsJcFtCp_vJCWqa9s8-6aO4FLPgoMI02k03t2WcL5bA',
        });
      });

      it('still returns redirect for external URLs regardless of signature', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: { redirectTo: new URL('https://app.metamask.io/buy') },
          signature: MISSING,
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
    });

    describe('when referringLink is missing or invalid', () => {
      it('returns null when deferredDeepLink is null', async () => {
        const result = await getDeferredDeepLinkRoute(null);
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
