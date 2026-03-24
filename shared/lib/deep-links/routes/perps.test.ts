import { perps } from './perps';
import { PERPS_ROUTE, Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('perpsRoute', () => {
  it('navigates to the internal perps route', () => {
    const result = perps.handler(new URLSearchParams());

    assertPathDestination(result);
    expect(result.path).toBe(PERPS_ROUTE);
    expect(result.query.toString()).toBe('');
  });

  it('ignores any extra params', () => {
    const result = perps.handler(new URLSearchParams({ foo: 'bar' }));

    assertPathDestination(result);
    expect(result.path).toBe(PERPS_ROUTE);
  });
});
