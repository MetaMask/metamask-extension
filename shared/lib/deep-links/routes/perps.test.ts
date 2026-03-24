import { perps } from './perps';
import { DEFAULT_ROUTE, Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('perpsRoute', () => {
  it('navigates to the home route with the perps tab selected', () => {
    const result = perps.handler(new URLSearchParams());

    assertPathDestination(result);
    expect(result.path).toBe(DEFAULT_ROUTE);
    expect(result.query.get('tab')).toBe('perps');
  });

  it('ignores any extra params', () => {
    const result = perps.handler(new URLSearchParams({ foo: 'bar' }));

    assertPathDestination(result);
    expect(result.path).toBe(DEFAULT_ROUTE);
    expect(result.query.get('tab')).toBe('perps');
  });
});
