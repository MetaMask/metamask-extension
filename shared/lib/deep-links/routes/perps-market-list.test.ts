import {
  VALID_MARKET_FILTERS,
  type MarketFilter,
} from '../../../constants/perps';
import {
  perpsMarketList,
  PerpsMarketListQueryParams,
} from './perps-market-list';
import { PERPS_MARKET_LIST_ROUTE, Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('perpsMarketListRoute', () => {
  it('navigates to the market list without a filter when no params are given', () => {
    const result = perpsMarketList.handler(new URLSearchParams());

    assertPathDestination(result);
    expect(result.path).toBe(PERPS_MARKET_LIST_ROUTE);
    expect(result.query.get(PerpsMarketListQueryParams.Filter)).toBeNull();
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(VALID_MARKET_FILTERS)(
    'passes through valid filter "%s"',
    (filter: MarketFilter) => {
      const result = perpsMarketList.handler(
        new URLSearchParams({ [PerpsMarketListQueryParams.Filter]: filter }),
      );

      assertPathDestination(result);
      expect(result.path).toBe(PERPS_MARKET_LIST_ROUTE);
      expect(result.query.get(PerpsMarketListQueryParams.Filter)).toBe(filter);
    },
  );

  it('ignores an invalid filter value', () => {
    const result = perpsMarketList.handler(
      new URLSearchParams({ [PerpsMarketListQueryParams.Filter]: 'invalid' }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(PERPS_MARKET_LIST_ROUTE);
    expect(result.query.get(PerpsMarketListQueryParams.Filter)).toBeNull();
  });

  it('ignores unknown extra params', () => {
    const result = perpsMarketList.handler(new URLSearchParams({ foo: 'bar' }));

    assertPathDestination(result);
    expect(result.path).toBe(PERPS_MARKET_LIST_ROUTE);
    expect(result.query.get('foo')).toBeNull();
  });
});
