import { withPins } from './api-mocks';

describe('withPins', () => {
  it('merges nested objects, keeps synced fields, and lets pins win', () => {
    const mock = {
      low: { fee: '1', wait: 15 },
      added: 'synced',
      list: [1, 2, 3],
    };
    const pins = { low: { fee: '9' }, list: [7] };
    expect(withPins(mock, pins)).toStrictEqual({
      low: { fee: '9', wait: 15 },
      added: 'synced',
      list: [7],
    });
    expect(mock.low.fee).toBe('1');
  });

  it('returns the pins when either side is not an object', () => {
    expect(withPins([1, 2], [3])).toStrictEqual([3]);
    expect(withPins({ a: 1 }, 'value')).toBe('value');
    expect(withPins(null, { a: 1 })).toStrictEqual({ a: 1 });
  });
});
