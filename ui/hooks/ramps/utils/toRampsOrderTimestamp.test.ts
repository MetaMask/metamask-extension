import { toRampsOrderTimestamp } from './toRampsOrderTimestamp';

describe('toRampsOrderTimestamp', () => {
  it('normalizes epoch milliseconds and ISO strings to the same value', () => {
    expect({
      epoch: toRampsOrderTimestamp(1784717900514),
      iso: toRampsOrderTimestamp('2026-07-22T10:58:20.514Z'),
      numericString: toRampsOrderTimestamp('1784717900514'),
    }).toMatchSnapshot();
  });

  it('falls back to 0 for unparseable values', () => {
    expect({
      notADate: toRampsOrderTimestamp('not-a-date'),
      nan: toRampsOrderTimestamp(Number.NaN),
      infinite: toRampsOrderTimestamp(Number.POSITIVE_INFINITY),
      undefinedValue: toRampsOrderTimestamp(undefined),
      nullValue: toRampsOrderTimestamp(null),
    }).toMatchSnapshot();
  });

  it('sorts mixed epoch and ISO timestamps newest first', () => {
    const mixed = [
      '2026-07-12T10:48:33.756Z',
      1784717900514,
      '2026-07-16T15:22:21.628Z',
    ];

    expect(
      [...mixed].sort(
        (a, b) => toRampsOrderTimestamp(b) - toRampsOrderTimestamp(a),
      ),
    ).toMatchSnapshot();
  });
});
