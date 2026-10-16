import { perpsMarkets } from './perps-markets';
import { PERPS_HOME_PAGE_ROUTE, type Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('perpsMarketsRoute', () => {
  it('navigates to the perps home page', () => {
    const result = perpsMarkets.handler(new URLSearchParams());

    assertPathDestination(result);
    expect(result.path).toBe(PERPS_HOME_PAGE_ROUTE);
    expect(result.query.toString()).toBe('');
  });

  it('ignores any params', () => {
    const result = perpsMarkets.handler(new URLSearchParams({ foo: 'bar' }));

    assertPathDestination(result);
    expect(result.path).toBe(PERPS_HOME_PAGE_ROUTE);
    expect(result.query.toString()).toBe('');
  });
});
