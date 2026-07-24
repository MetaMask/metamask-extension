import { getDeferredDeepLinkRoute, buildInterstitialRoute } from './utils';
import { DeferredDeepLinkRouteType } from './types';
import * as parseModule from './parse';
import { VALID, MISSING, INVALID } from './verify';
import { BridgeQueryParams } from './routes/swap';
import { SWAP_ROUTE } from './routes/route';

jest.mock('./parse');

const mockParse = parseModule.parse as jest.MockedFunction<
  typeof parseModule.parse
>;

const mockBuyLink =
  'https://link.metamask.io/buy?address=0xacA92E438df0B2401fF60dA7E4337B687a2435DA&amount=100&chainId=1&sig=aagQN9osZ1tfoYIEKvU6t5i8FVaW4Gi6EGimMcZ0VTDmAlPDk800-Nx3131QlDTmO3UF2JCmR2Y2RAJhceNOYw';
const mockSwapLink =
  'https://link.metamask.io/swap?amount=22000000000000000&from=eip155%3A1%2Fslip44%3A60&sig_params=amount%2Cfrom%2Cto&to=eip155%3A59144%2Ferc20%3A0x176211869cA2b568f2A7D4EE941E073a821EE1ff&sig=KYoYO9beWAlLIT6GUATcHj98hoDiO9h3UZC76ZcMfreKsJcFtCp_vJCWqa9s8-6aO4FLPgoMI02k03t2WcL5bA';
const mockUnsignedSwapLink =
  'https://link.metamask.io/swap?amount=22000000000000000&from=eip155%3A1%2Fslip44%3A60&sig_params=amount%2Cfrom%2Cto&to=eip155%3A59144%2Ferc20%3A0x176211869cA2b568f2A7D4EE941E073a821EE1ff';
const mockInvalidSwapLink =
  'https://link.metamask.io/swap?amount=22000000000000000&from=eip155%3A1%2Fslip44%3A60&sig_params=amount%2Cfrom%2Cto&to=eip155%3A59144%2Ferc20%3A0x176211869cA2b568f2A7D4EE941E073a821EE1ff&sig=aW52YWxpZC1zaWduYXR1cmU=';
const mockFreshSwapLink = 'https://link.metamask.io/swap?amount=50';
const mockHomeLink = 'https://link.metamask.io/home?openNetworkSelector=true';

function getMockSwapDestination() {
  return {
    path: SWAP_ROUTE,
    query: new URLSearchParams([
      [BridgeQueryParams.From, 'eip155:1/slip44:60'],
      [
        BridgeQueryParams.To,
        'eip155:59144/erc20:0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
      ],
      [BridgeQueryParams.Amount, '22000000000000000'],
    ]),
  };
}

function getMockSwapDestinationRoute() {
  const { path, query } = getMockSwapDestination();
  return `${path}?${query.toString()}`;
}

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
          route: { pathname: '/buy' } as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockBuyLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Redirect,
          url: 'https://app.metamask.io/buy',
          signature: VALID,
        });
      });

      it('returns navigate route for internal route with valid signature', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: getMockSwapDestination(),
          signature: VALID,
          route: { pathname: '/swap' } as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockSwapLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Navigate,
          route: getMockSwapDestinationRoute(),
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
          route: { pathname: '/buy' } as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockBuyLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Redirect,
          url: 'https://app.metamask.io/buy',
          signature: VALID,
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
          route: { pathname: '/swap' } as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockFreshSwapLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Navigate,
          route: '/swap?amount=50',
          signature: VALID,
        });
      });
    });

    describe('when signature is missing or invalid', () => {
      it('returns navigate route for unsigned whitelisted link', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: getMockSwapDestination(),
          signature: MISSING,
          route: { pathname: '/swap' } as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockUnsignedSwapLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Navigate,
          route: getMockSwapDestinationRoute(),
          signature: MISSING,
        });
      });

      it('returns navigate route for whitelisted link with invalid signature', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: getMockSwapDestination(),
          signature: INVALID,
          route: { pathname: '/swap' } as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockInvalidSwapLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Navigate,
          route: getMockSwapDestinationRoute(),
          signature: INVALID,
        });
      });

      it('returns interstitial route for unsigned non-whitelisted link', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: {
            path: '/',
            query: new URLSearchParams('openNetworkSelector=true'),
          },
          signature: MISSING,
          route: { pathname: '/home' } as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockHomeLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Interstitial,
          urlPathAndQuery: '/home?openNetworkSelector=true',
          signature: MISSING,
        });
      });

      it('still returns redirect for whitelisted external URLs regardless of signature', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: { redirectTo: new URL('https://app.metamask.io/buy') },
          signature: MISSING,
          route: { pathname: '/buy' } as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: mockBuyLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Redirect,
          url: 'https://app.metamask.io/buy',
          signature: MISSING,
        });
      });

      it('returns interstitial route for unsigned non-whitelisted external URL redirect', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);

        mockParse.mockResolvedValue({
          destination: {
            redirectTo: new URL('https://support.metamask.io/onboarding'),
          },
          signature: MISSING,
          route: { pathname: '/onboarding' } as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: 'https://link.metamask.io/onboarding',
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Interstitial,
          urlPathAndQuery: '/onboarding',
          signature: MISSING,
        });
      });

      it('returns interstitial route for unsigned asset link', async () => {
        const createdAt = 1000000;
        jest.setSystemTime(createdAt + 60 * 1000);
        const assetLink =
          'https://link.metamask.io/asset?assetId=eip155%3A1%2Ferc20%3A0x6b175474e89094c44da98b954eedeac495271d0f';

        mockParse.mockResolvedValue({
          destination: {
            path: '/asset/eip155:1/eip155%3A1%2Ferc20%3A0x6b175474e89094c44da98b954eedeac495271d0f',
            query: new URLSearchParams(),
          },
          signature: MISSING,
          route: { pathname: '/asset' } as never,
        });

        const result = await getDeferredDeepLinkRoute({
          createdAt,
          referringLink: assetLink,
        });

        expect(result).toStrictEqual({
          type: DeferredDeepLinkRouteType.Interstitial,
          urlPathAndQuery:
            '/asset?assetId=eip155%3A1%2Ferc20%3A0x6b175474e89094c44da98b954eedeac495271d0f',
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
