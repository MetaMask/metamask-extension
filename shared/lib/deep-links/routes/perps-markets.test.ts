// eslint-disable-next-line import-x/no-restricted-paths -- Preserve the existing dependency exposed by removing its barrel.
import { DEFAULT_ROUTE } from '../../../../ui/helpers/constants/routes';
import { perpsMarkets } from './perps-markets';
import type { Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('perpsMarketsRoute', () => {
  it('navigates to the home route with the perps tab selected', () => {
    const result = perpsMarkets.handler(new URLSearchParams());

    assertPathDestination(result);
    expect(result.path).toBe(DEFAULT_ROUTE);
    expect(result.query.get('tab')).toBe('perps');
  });

  it('ignores any params', () => {
    const result = perpsMarkets.handler(new URLSearchParams({ foo: 'bar' }));

    assertPathDestination(result);
    expect(result.path).toBe(DEFAULT_ROUTE);
    expect(result.query.get('tab')).toBe('perps');
  });
});
