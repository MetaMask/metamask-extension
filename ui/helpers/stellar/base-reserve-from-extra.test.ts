import { getBaseReserveFromExtra } from './base-reserve-from-extra';

describe('getBaseReserveFromExtra', () => {
  it('returns baseReserve when extra contains a valid value', () => {
    expect(getBaseReserveFromExtra({ baseReserve: '2.5' })).toBe('2.5');
  });

  it('returns undefined when extra is missing', () => {
    expect(getBaseReserveFromExtra(undefined)).toBeUndefined();
  });

  it('returns undefined when baseReserve is missing', () => {
    expect(getBaseReserveFromExtra({ limit: '1000' })).toBeUndefined();
  });

  it('returns undefined for non-numeric baseReserve', () => {
    expect(getBaseReserveFromExtra({ baseReserve: 'invalid' })).toBeUndefined();
  });

  it('returns undefined for negative baseReserve', () => {
    expect(getBaseReserveFromExtra({ baseReserve: '-1' })).toBeUndefined();
  });
});
