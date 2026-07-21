import type { CaipAssetType } from '@metamask/utils';
import { searchTokens } from '../../token-search/token-search-api';
import type * as InterstitialBypassAsyncModule from './interstitial-bypass-async';

function loadInterstitialBypassAsyncModule() {
  type InterstitialBypassAsyncModule = typeof InterstitialBypassAsyncModule;
  let module: InterstitialBypassAsyncModule | undefined;

  jest.isolateModules(() => {
    module = jest.requireActual(
      './interstitial-bypass-async',
    ) as InterstitialBypassAsyncModule;
  });

  if (!module) {
    throw new Error('Failed to load interstitial-bypass-async module');
  }

  return module;
}

jest.mock('../../token-search/token-search-api', () => ({
  searchTokens: jest.fn(),
}));
const mockSearchTokens = jest.mocked(searchTokens);

const DAI_ASSET_ID =
  'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f';
const AKITA_ASSET_ID =
  'eip155:1/erc20:0x3301ee63fb29f863f2333bd4466acb46cd8323e6';
const WARB_ASSET_ID =
  'eip155:1/erc20:0xb047c8032b99841713b8e3872f06cf32beb27b82';

function buildSearchResult(assetId: CaipAssetType, resultType?: string) {
  return {
    assetId,
    name: 'Token',
    symbol: 'TKN',
    decimals: 18,
    ...(resultType === undefined ? {} : { securityData: { resultType } }),
  };
}

function mockSearchResponse(
  results: { assetId: CaipAssetType; resultType?: string }[],
) {
  const data = results.map(({ assetId, resultType }) =>
    buildSearchResult(assetId, resultType),
  );

  return {
    data,
    count: data.length,
    totalCount: data.length,
    pageInfo: { hasNextPage: false, endCursor: '' },
  };
}

describe('isKnownSafeDeepLinkAsset', () => {
  let isKnownSafeDeepLinkAsset: ReturnType<
    typeof loadInterstitialBypassAsyncModule
  >['isKnownSafeDeepLinkAsset'];

  beforeEach(() => {
    mockSearchTokens.mockReset();
    ({ isKnownSafeDeepLinkAsset } = loadInterstitialBypassAsyncModule());
  });

  const noTokenApiLookupCases = [
    {
      description:
        'returns true for native slip44 assets without calling the Token API',
      assetId: 'eip155:1/slip44:60',
      expected: true,
      assert: () => {
        expect(mockSearchTokens).not.toHaveBeenCalled();
      },
    },
    {
      description: 'returns false for invalid asset ids',
      assetId: 'not-caip',
      expected: false,
      assert: () => {
        expect(mockSearchTokens).not.toHaveBeenCalled();
      },
    },
  ];

  const safeTokenLookupCases = [
    {
      description:
        'returns true when the security scan marks the asset as Verified',
      assetId: DAI_ASSET_ID,
      expected: true,
      arrange: () => {
        mockSearchTokens.mockResolvedValue(
          mockSearchResponse([
            { assetId: DAI_ASSET_ID, resultType: 'Verified' },
          ]),
        );
      },
      assert: () => {
        expect(mockSearchTokens).toHaveBeenCalledWith(
          expect.objectContaining({
            query: '0x6b175474e89094c44da98b954eedeac495271d0f',
            networks: ['eip155:1'],
            includeTokenSecurityData: true,
            first: 10,
          }),
        );
      },
    },
    {
      description: 'returns true for Benign meme coins',
      assetId: AKITA_ASSET_ID,
      expected: true,
      arrange: () => {
        mockSearchTokens.mockResolvedValue(
          mockSearchResponse([
            { assetId: AKITA_ASSET_ID, resultType: 'Benign' },
          ]),
        );
      },
    },
    {
      description: 'returns true for Malicious meme coins',
      assetId: WARB_ASSET_ID,
      expected: true,
      arrange: () => {
        mockSearchTokens.mockResolvedValue(
          mockSearchResponse([
            { assetId: WARB_ASSET_ID, resultType: 'Malicious' },
          ]),
        );
      },
    },
    {
      description: 'returns true when the asset has no security data',
      assetId: WARB_ASSET_ID,
      expected: true,
      arrange: () => {
        mockSearchTokens.mockResolvedValue(
          mockSearchResponse([{ assetId: WARB_ASSET_ID }]),
        );
      },
    },
    {
      description: 'matches the asset id case-insensitively',
      assetId: 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F',
      expected: true,
      arrange: () => {
        mockSearchTokens.mockResolvedValue(
          mockSearchResponse([
            { assetId: DAI_ASSET_ID, resultType: 'Verified' },
          ]),
        );
      },
    },
  ];

  const unsafeTokenLookupCases = [
    {
      description: 'returns false only when the security scan result is Spam',
      assetId: WARB_ASSET_ID,
      expected: false,
      arrange: () => {
        mockSearchTokens.mockResolvedValue(
          mockSearchResponse([{ assetId: WARB_ASSET_ID, resultType: 'Spam' }]),
        );
      },
    },
    {
      description: 'returns false when the search returns no matching asset',
      assetId: WARB_ASSET_ID,
      expected: false,
      arrange: () => {
        mockSearchTokens.mockResolvedValue(
          mockSearchResponse([
            { assetId: DAI_ASSET_ID, resultType: 'Verified' },
          ]),
        );
      },
    },
    {
      description: 'returns false when the search returns no results',
      assetId: DAI_ASSET_ID,
      expected: false,
      arrange: () => {
        mockSearchTokens.mockResolvedValue({
          data: [],
          count: 0,
          totalCount: 0,
          pageInfo: { hasNextPage: false, endCursor: '' },
        });
      },
    },
  ];

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(noTokenApiLookupCases)(
    '$description',
    async (testCase: (typeof noTokenApiLookupCases)[number]) => {
      await expect(isKnownSafeDeepLinkAsset(testCase.assetId)).resolves.toBe(
        testCase.expected,
      );

      testCase.assert?.();
    },
  );

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(safeTokenLookupCases)(
    '$description',
    async (testCase: (typeof safeTokenLookupCases)[number]) => {
      testCase.arrange?.();

      await expect(isKnownSafeDeepLinkAsset(testCase.assetId)).resolves.toBe(
        testCase.expected,
      );

      testCase.assert?.();
    },
  );

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(unsafeTokenLookupCases)(
    '$description',
    async (testCase: (typeof unsafeTokenLookupCases)[number]) => {
      testCase.arrange?.();

      await expect(isKnownSafeDeepLinkAsset(testCase.assetId)).resolves.toBe(
        testCase.expected,
      );
    },
  );

  const tokenApiFailureCases = [
    {
      description: 'fails closed when the Token API request fails',
      arrange: () => {
        mockSearchTokens.mockRejectedValue(new Error('network down'));
      },
      assert: () => {
        expect(mockSearchTokens).toHaveBeenCalled();
      },
    },
    {
      description:
        'fails closed when the Token API lookup exceeds the deadline',
      arrange: () => {
        const mockAbortInvoked = jest.fn();
        mockSearchTokens.mockImplementation(async ({ signal }) => {
          // Main Test Arrangement
          signal?.addEventListener('abort', () => {
            mockAbortInvoked();
          });

          // Delay response
          const delay = (ms: number) =>
            new Promise((resolve) => setTimeout(resolve, ms));
          await delay(100);
          return await mockSearchResponse([]);
        });

        // timeout is shorter than delay to ensure abort is triggered
        return { mockAbortInvoked, timeout: 50 };
      },
      assert: (mocks: { mockAbortInvoked?: jest.Mock }) => {
        expect(mocks.mockAbortInvoked).toHaveBeenCalled();
      },
    },
  ];

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(tokenApiFailureCases)(
    '$description',
    async (testCase: (typeof tokenApiFailureCases)[number]) => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      try {
        const mocks = testCase.arrange?.();

        expect(
          await isKnownSafeDeepLinkAsset(DAI_ASSET_ID, {
            lookupTimeoutMs: mocks?.timeout,
          }),
        ).toBe(false);

        testCase.assert?.(mocks ?? {});
      } finally {
        consoleErrorSpy.mockRestore();
      }
    },
  );
});

describe('canBypassDeepLinkInterstitial', () => {
  let canBypassDeepLinkInterstitialAsync: ReturnType<
    typeof loadInterstitialBypassAsyncModule
  >['canBypassDeepLinkInterstitialAsync'];

  beforeEach(() => {
    mockSearchTokens.mockReset();
    ({ canBypassDeepLinkInterstitialAsync } =
      loadInterstitialBypassAsyncModule());
  });

  const canBypassWithoutTokenLookupCases = [
    {
      description: 'does not bypass for non-asset routes',
      route: { pathname: '/swap' },
      expected: false,
      assert: () => {
        expect(mockSearchTokens).not.toHaveBeenCalled();
      },
    },
    {
      description: 'does not bypass /asset links without an assetId',
      route: { pathname: '/asset' },
      deepLinkUrl: new URL('https://link.metamask.io/asset'),
      expected: false,
      assert: () => {
        expect(mockSearchTokens).not.toHaveBeenCalled();
      },
    },
  ];

  const canBypassWithTokenLookupCases = [
    {
      description:
        'bypasses /asset when the security scan marks the asset as safe',
      route: { pathname: '/asset' },
      deepLinkUrl: new URL(
        `https://link.metamask.io/asset?assetId=${DAI_ASSET_ID}`,
      ),
      expected: true,
      arrange: () => {
        mockSearchTokens.mockResolvedValue(
          mockSearchResponse([
            { assetId: DAI_ASSET_ID, resultType: 'Verified' },
          ]),
        );
      },
    },
    {
      description: 'does not bypass /asset for spam listings',
      route: { pathname: '/asset' },
      deepLinkUrl: new URL(
        `https://link.metamask.io/asset?assetId=${WARB_ASSET_ID}`,
      ),
      expected: false,
      arrange: () => {
        mockSearchTokens.mockResolvedValue(
          mockSearchResponse([{ assetId: WARB_ASSET_ID, resultType: 'Spam' }]),
        );
      },
    },
  ];

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(canBypassWithoutTokenLookupCases)(
    '$description',
    async (testCase: (typeof canBypassWithoutTokenLookupCases)[number]) => {
      await expect(
        canBypassDeepLinkInterstitialAsync(
          testCase.route,
          testCase.deepLinkUrl,
        ),
      ).resolves.toBe(testCase.expected);

      testCase.assert?.();
    },
  );

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(canBypassWithTokenLookupCases)(
    '$description',
    async (testCase: (typeof canBypassWithTokenLookupCases)[number]) => {
      testCase.arrange?.();

      await expect(
        canBypassDeepLinkInterstitialAsync(
          testCase.route,
          testCase.deepLinkUrl,
        ),
      ).resolves.toBe(testCase.expected);
    },
  );
});
