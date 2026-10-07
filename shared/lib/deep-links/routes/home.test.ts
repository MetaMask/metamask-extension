// eslint-disable-next-line import-x/no-restricted-paths -- Preserve the existing dependency exposed by removing its barrel.
import { DEFAULT_ROUTE } from '../../../../ui/helpers/constants/routes';
import { home, HomeQueryParams } from './home';
import { Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('homeRoute', () => {
  type TestCase = {
    searchParamVal: string | undefined;
    expected: string | null;
  };

  const testCases: TestCase[] = [
    { searchParamVal: 'true', expected: 'true' },
    { searchParamVal: '1', expected: 'true' },
    { searchParamVal: 'false', expected: null },
    { searchParamVal: '', expected: null },
    { searchParamVal: undefined, expected: null },
  ];

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(testCases)(
    'homeRoute.handler correctly handles openNetworkSelector param: input=$searchParamVal, expected=$expected',
    ({ searchParamVal, expected }: TestCase) => {
      const params =
        typeof searchParamVal === 'undefined'
          ? new URLSearchParams()
          : new URLSearchParams({
              [HomeQueryParams.OpenNetworkSelector]: searchParamVal,
            });

      const result = home.handler(params);

      assertPathDestination(result);
      expect(result.path).toBe(DEFAULT_ROUTE);
      expect(result.query.get(HomeQueryParams.OpenNetworkSelector)).toBe(
        expected,
      );
    },
  );
});
