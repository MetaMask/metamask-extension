import { privacy } from './privacy';
import { PRIVACY_ROUTE, type Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('privacyRoute', () => {
  it('navigates to the privacy settings scrolled to the metametrics toggle by default', () => {
    const result = privacy.handler(new URLSearchParams());

    assertPathDestination(result);
    expect(result.path).toBe(`${PRIVACY_ROUTE}#metametrics`);
    expect(result.query.toString()).toBe('');
  });

  it('scrolls to the metametrics toggle when setting=metametrics', () => {
    const result = privacy.handler(
      new URLSearchParams({ setting: 'metametrics' }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(`${PRIVACY_ROUTE}#metametrics`);
  });

  it('scrolls to the data collection toggle when setting=data-collection', () => {
    const result = privacy.handler(
      new URLSearchParams({ setting: 'data-collection' }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(`${PRIVACY_ROUTE}#data-collection`);
  });

  it('falls back to the metametrics toggle for unknown setting values', () => {
    const result = privacy.handler(
      new URLSearchParams({ setting: 'not-a-setting' }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(`${PRIVACY_ROUTE}#metametrics`);
  });

  it('ignores unrelated params', () => {
    const result = privacy.handler(new URLSearchParams({ foo: 'bar' }));

    assertPathDestination(result);
    expect(result.path).toBe(`${PRIVACY_ROUTE}#metametrics`);
    expect(result.query.toString()).toBe('');
  });
});
