import { parseHexPermissionAmount } from './parse-hex-permission-amount';

describe('parseHexPermissionAmount', () => {
  it('interprets unprefixed digits as hex so round-trip via toString(16) matches 0x-prefixed hex', () => {
    const bn = parseHexPermissionAmount('1000');
    expect(`0x${bn.toString(16)}`).toBe('0x1000');
    expect(bn.toFixed(0)).toBe('4096');
  });

  it('parses explicit 0x hex the same as unprefixed hex for the same magnitude', () => {
    expect(
      parseHexPermissionAmount('0x1000').eq(parseHexPermissionAmount('1000')),
    ).toBe(true);
  });

  it('parses 0x3e8 as decimal 1000 wei', () => {
    const bn = parseHexPermissionAmount('0x3e8');
    expect(bn.toFixed(0)).toBe('1000');
    expect(`0x${bn.toString(16)}`).toBe('0x3e8');
  });

  it('throws for an empty string', () => {
    expect(() => parseHexPermissionAmount('')).toThrow(
      'Cannot parse empty permission amount',
    );
    expect(() => parseHexPermissionAmount('   ')).toThrow(
      'Cannot parse empty permission amount',
    );
  });
});
