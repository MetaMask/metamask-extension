import { asset, AssetQueryParams } from './asset';
import { isDeepLinkRouteAllowedToBypassInterstitial } from './interstitial-bypass';
import { Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('assetRoute', () => {
  it('does not bypass the deep link interstitial', () => {
    expect(isDeepLinkRouteAllowedToBypassInterstitial(asset)).toBe(false);
  });

  type TestCase = {
    assetIdParam: string | undefined;
    expectedPath: string;
  };

  const testCases: TestCase[] = [
    {
      assetIdParam:
        'eip155:59144/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
      expectedPath:
        '/asset/eip155:59144/eip155%3A59144%2Ferc20%3A0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
    },
    {
      assetIdParam: 'eip155:59144/slip44:60',
      expectedPath: '/asset/eip155:59144/eip155%3A59144%2Fslip44%3A60',
    },
    {
      assetIdParam:
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y',
      expectedPath:
        '/asset/solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Ftoken%3A3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y',
    },
    {
      assetIdParam: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      expectedPath:
        '/asset/solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Fslip44%3A501',
    },
  ];

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(testCases)(
    'assetRoute.handler correctly handles assetId param: input=$assetIdParam, expected=$expected',
    ({ assetIdParam: searchParamVal, expectedPath }: TestCase) => {
      const params =
        typeof searchParamVal === 'undefined'
          ? new URLSearchParams()
          : new URLSearchParams({
              [AssetQueryParams.AssetId]: searchParamVal,
            });

      const result = asset.handler(params);

      assertPathDestination(result);
      expect(result.path).toBe(expectedPath);
      expect(result.query.size).toBe(0);
    },
  );

  type TestCaseWithInvalidAssetId = {
    assetIdParam: string | undefined;
    expectedError: string;
  };

  const testCasesWithInvalidAssetId: TestCaseWithInvalidAssetId[] = [
    { assetIdParam: undefined, expectedError: 'Missing assetId parameter' },
    {
      assetIdParam: 'not-caip-asset-id',
      expectedError: 'Invalid assetId parameter',
    },
  ];

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(testCasesWithInvalidAssetId)(
    'assetRoute.handler throws error for invalid assetId param: input=$assetIdParam, expectedError=$expectedError',
    ({ assetIdParam, expectedError }: TestCaseWithInvalidAssetId) => {
      const params =
        assetIdParam === undefined
          ? new URLSearchParams()
          : new URLSearchParams({
              [AssetQueryParams.AssetId]: assetIdParam,
            });

      expect(() => asset.handler(params)).toThrow(expectedError);
    },
  );
});
