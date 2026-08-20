import { createCacheKey } from './trust-signals';

describe('createCacheKey', () => {
  it('keys by lowercased chainId and address', () => {
    expect(
      createCacheKey('0xA4B1', '0xABCDEF0000000000000000000000000000000001'),
    ).toBe('0xa4b1:0xabcdef0000000000000000000000000000000001');
  });
});
