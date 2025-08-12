import {
  type Hex,
  toHex,
  isHex,
  pad,
  concat,
  isAddress,
  toFunctionSelector,
} from './utils';

describe('toHex', () => {
  it('should convert string to hex', () => {
    expect(toHex('hello')).toBe('0x68656c6c6f');
  });

  it('should convert number to hex', () => {
    expect(toHex(123)).toBe('0x7b');
  });

  it('should convert boolean to hex', () => {
    expect(toHex(true)).toBe('0x1');
    expect(toHex(false)).toBe('0x0');
  });

  it('should handle Buffer input', () => {
    const buffer = Buffer.from('hello');
    expect(toHex(buffer)).toBe('0x68656c6c6f');
  });

  it('should handle Uint8Array input', () => {
    const uint8Array = new Uint8Array([104, 101, 108, 108, 111]); // 'hello'
    expect(toHex(uint8Array)).toBe('0x68656c6c6f');
  });

  it('should pad hex string to specified size', () => {
    expect(toHex('hello', { size: 32 })).toBe(
      '0x00000000000000000000000000000000000000000000000000000068656c6c6f',
    );
  });
});

describe('isHex', () => {
  it('should return true for valid hex strings', () => {
    expect(isHex('0x1234')).toBe(true);
    expect(isHex('0xabcdef')).toBe(true);
  });

  it('should return false for invalid hex strings', () => {
    expect(isHex('0xghij')).toBe(false);
    expect(isHex('1234')).toBe(false);
    expect(isHex('')).toBe(false);
  });

  it('should handle non-strict mode', () => {
    expect(isHex('0x1234', { strict: false })).toBe(true);
    expect(isHex('123abc', { strict: false })).toBe(true);
    expect(isHex('123zzz', { strict: false })).toBe(false);
  });
});

describe('pad', () => {
  it('should pad hex string to the left by default', () => {
    expect(pad('0x1234')).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000001234',
    );
  });

  it('should pad hex string to the right when specified', () => {
    expect(pad('0x1234', { dir: 'right' })).toBe(
      '0x1234000000000000000000000000000000000000000000000000000000000000',
    );
  });

  it('should handle custom size', () => {
    expect(pad('0x1234', { size: 4 })).toBe('0x00001234');
  });

  it('should throw error when hex string is too long', () => {
    const hex: Hex = `0x${'1'.repeat(65)}`;
    expect(() => pad(hex)).toThrow(`Cannot pad ${hex} to 32 bytes`);
  });
});

describe('concat', () => {
  it('should concatenate hex strings', () => {
    expect(concat(['0x1234', '0x5678'])).toBe('0x12345678');
  });

  it('should handle multiple hex strings', () => {
    expect(concat(['0x12', '0x34', '0x56', '0x78'])).toBe('0x12345678');
  });
});

describe('isAddress', () => {
  it('should return true for valid addresses', () => {
    expect(isAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(true);
  });

  it('should return false for invalid addresses', () => {
    expect(isAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44')).toBe(false);
    expect(isAddress('742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(false);
  });

  it('should handle non-strict mode', () => {
    expect(
      isAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', {
        strict: false,
      }),
    ).toBe(true);
  });
});

describe('toFunctionSelector', () => {
  it('should generate correct function selector', () => {
    const fn = 'function ownerOf(uint256 tokenId)';
    expect(toFunctionSelector(fn)).toBe('0x6352211e');
  });

  it('should handle function with multiple parameters', () => {
    const fn =
      'function transferFrom(address from, address to, uint256 tokenId)';
    expect(toFunctionSelector(fn)).toBe('0x23b872dd');
  });

  it('should throw error for invalid function signature', () => {
    expect(() => toFunctionSelector('invalid function')).toThrow(
      'Unable to normalize signature.',
    );
  });
});
