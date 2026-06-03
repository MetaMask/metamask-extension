import { isTronAddress } from './tron';

// Valid TRON addresses in Base58 format (starting with T)
const VALID_BASE58_ADDRESSES = [
  'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT contract address on TRON
  'THPvaUhoh2Qn2y9THCZML3H815hhFhn5YC', // Valid mainnet address
  'TQjaZ9FD473QBTdUzMLmSyoGB6Yz1CGpux', // Valid address
  'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9', // Valid address
  'TLsV52sRDL79HXGGm9yzwKibb6BeruhUzy', // Valid address
];

// Valid TRON addresses in hex format (42 characters, prefix 41)
const VALID_HEX_ADDRESSES = [
  '41a614f803b6fd780986a42c78ec9c7f77e6ded13c', // Example from documentation
  '418840E6C55B9ADA326D211D818C34A994AECED808', // Valid hex address
  '41A614F803B6FD780986A42C78EC9C7F77E6DED13C', // Uppercase variant
];

// Invalid addresses - wrong format
const INVALID_FORMAT_ADDRESSES = [
  'invalid', // Too short
  '1234567890123456789012345678901234', // Wrong length
  'TRX9Uhjxvb9tjfQHWQJKAQQaFcUx3N6Tv', // Wrong length (33 chars instead of 34)
  'TRX9Uhjxvb9tjfQHWQJKAQQaFcUx3N6TvTT', // Wrong length (35 chars instead of 34)
  'ARX9Uhjxvb9tjfQHWQJKAQQaFcUx3N6TvT', // Wrong prefix (A instead of T)
  '0x41a614f803b6fd780986a42c78ec9c7f77e6ded13c', // Hex with 0x prefix (should fail)
  '41a614f803b6fd780986a42c78ec9c7f77e6ded1', // Too short hex (40 chars instead of 42)
  '41a614f803b6fd780986a42c78ec9c7f77e6ded13caa', // Too long hex (44 chars)
  '51a614f803b6fd780986a42c78ec9c7f77e6ded13c', // Wrong prefix byte (51 instead of 41)
];

// Invalid addresses - wrong checksum
const INVALID_CHECKSUM_ADDRESSES = [
  'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6A', // Modified last character
  'THPvaUhoh2Qn2y9THCZML3H815hhFhn5Ya', // Modified last character
  'TQjaZ9FD473QBTdUzMLmSyoGB6Yz1CGpuX', // Modified last character (lowercase x to uppercase X)
];

// Edge cases - non-string types
const NON_STRING_VALUES = [
  null,
  undefined,
  123,
  123n,
  true,
  false,
  {},
  [],
  ['TRX9Uhjxvb9tjfQHWQJKAQQaFcUx3N6TvT'],
  { address: 'TRX9Uhjxvb9tjfQHWQJKAQQaFcUx3N6TvT' },
];

describe('TRON Address Validator', () => {
  describe('isTronAddress', () => {
    describe('Valid Base58 addresses', () => {
      // @ts-expect-error This is missing from the Mocha type definitions
      it.each(VALID_BASE58_ADDRESSES)(
        'returns true for valid Base58 address: %s',
        (address: string) => {
          expect(isTronAddress(address)).toBe(true);
        },
      );
    });

    describe('Valid hex addresses', () => {
      // @ts-expect-error This is missing from the Mocha type definitions
      it.each(VALID_HEX_ADDRESSES)(
        'returns true for valid hex address: %s',
        (address: string) => {
          expect(isTronAddress(address)).toBe(true);
        },
      );
    });

    describe('Invalid format addresses', () => {
      // @ts-expect-error This is missing from the Mocha type definitions
      it.each(INVALID_FORMAT_ADDRESSES)(
        'returns false for invalid format address: %s',
        (address: string) => {
          expect(isTronAddress(address)).toBe(false);
        },
      );
    });

    describe('Invalid checksum addresses', () => {
      // @ts-expect-error This is missing from the Mocha type definitions
      it.each(INVALID_CHECKSUM_ADDRESSES)(
        'returns false for invalid checksum address: %s',
        (address: string) => {
          expect(isTronAddress(address)).toBe(false);
        },
      );
    });

    describe('Edge cases - non-string types', () => {
      // @ts-expect-error This is missing from the Mocha type definitions
      it.each(NON_STRING_VALUES)(
        'returns false for non-string value: %p',
        (value: unknown) => {
          expect(isTronAddress(value as string)).toBe(false);
        },
      );
    });

    describe('Special cases', () => {
      it('returns false for empty string', () => {
        expect(isTronAddress('')).toBe(false);
      });

      it('returns false for string with only spaces', () => {
        expect(isTronAddress('   ')).toBe(false);
      });

      it('returns false for Ethereum addresses', () => {
        expect(isTronAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(
          false,
        );
      });

      it('returns false for Bitcoin addresses', () => {
        expect(isTronAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(false);
      });

      it('returns false for Solana addresses', () => {
        expect(
          isTronAddress('7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV'),
        ).toBe(false);
      });

      it('handles addresses with non-base58 characters', () => {
        // Base58 does not include 0, O, I, or l to avoid confusion
        expect(isTronAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj0O')).toBe(false); // Contains 0 and O which are not valid in Base58
      });
    });

    describe('Case sensitivity', () => {
      it('handles mixed case hex addresses correctly', () => {
        expect(
          isTronAddress('41A614F803b6fd780986a42c78ec9c7f77e6ded13c'),
        ).toBe(true);
      });

      it('is case-sensitive for Base58 addresses', () => {
        // Base58 is case-sensitive by design
        const validAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
        expect(isTronAddress(validAddress)).toBe(true);

        // Changing case should invalidate the address
        const modifiedAddress = validAddress.toLowerCase();

        expect(isTronAddress(modifiedAddress)).toBe(false);
      });
    });

    describe('Hex to Base58 conversion', () => {
      it('validates hex address by converting to Base58', () => {
        // These are corresponding hex and Base58 pairs
        const hexAddress = '41a614f803b6fd780986a42c78ec9c7f77e6ded13c';
        expect(isTronAddress(hexAddress)).toBe(true);
      });

      it('rejects hex addresses with 0x prefix', () => {
        const hexWithPrefix = '0x41a614f803b6fd780986a42c78ec9c7f77e6ded13c';
        expect(isTronAddress(hexWithPrefix)).toBe(false);
      });
    });
  });
});
