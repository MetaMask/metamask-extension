import { setSubtract } from './set-utils';

describe('setSubtract', () => {
  it('returns the values in the first set that are not in the second', () => {
    const difference = setSubtract(new Set(['a', 'b', 'c']), new Set(['b']));

    expect(difference).toStrictEqual(new Set(['a', 'c']));
  });

  it('ignores values that are only in the second set', () => {
    const difference = setSubtract(new Set(['a']), new Set(['a', 'b']));

    expect(difference).toStrictEqual(new Set());
  });
});
