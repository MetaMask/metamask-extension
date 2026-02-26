import { getBooleanFlag } from './common-utils';

describe('getBooleanFlag', () => {
  it('returns `true` for `true` and `"true"`', () => {
    expect(getBooleanFlag(true)).toBe(true);
    expect(getBooleanFlag('true')).toBe(true);
  });

  it('returns `false` for other values', () => {
    expect(getBooleanFlag(false)).toBe(false);
    expect(getBooleanFlag('false')).toBe(false);
    expect(getBooleanFlag(undefined)).toBe(false);
    expect(getBooleanFlag('foo')).toBe(false);
  });
});
