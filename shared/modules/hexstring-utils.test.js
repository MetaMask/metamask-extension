import { toChecksumAddress } from 'ethereumjs-util';
import { isValidHexAddress } from './hexstring-utils';

describe('hexstring utils', function () {
  describe('isPossibleAddress', function () {
    it('should allow 40-char non-prefixed hex', function () {
      const address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b825';
      const result = isPossibleAddress(address);
      expect(result).toStrictEqual(true);
    });
    it('should allow 42-char prefixed hex', function () {
      const address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825';
      const result = isPossibleAddress(address);
      expect(result).toStrictEqual(true);
    });
    it('should not allow 42-char prefixed non-hex', function () {
      const address = '0xzzzz65c8e26263f6d9a1b5de9555d2931a33b825';
      const result = isPossibleAddress(address);
      expect(result).toStrictEqual(false);
    });
    it('should not allow 40-char non-prefixed non-hex', function () {
      const address = 'zzzz65c8e26263f6d9a1b5de9555d2931a33b825';
      const result = isPossibleAddress(address);
      expect(result).toStrictEqual(false);
    });
    it('should not allow shorter prefixed hex strings', function () {
      const address = '0x1234';
      const result = isPossibleAddress(address);
      expect(result).toStrictEqual(false);
    });
    it('should not allow shorter non-prefixed hex strings', function () {
      const address = '1234';
      const result = isPossibleAddress(address);
      expect(result).toStrictEqual(false);
    });
    it('should not allow longer prefixed hex strings', function () {
      const address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825fdea65c8e262';
      const result = isPossibleAddress(address);
      expect(result).toStrictEqual(false);
    });
    it('should not allow longer non-prefixed hex strings', function () {
      const address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b825fdea65c8e262';
      const result = isPossibleAddress(address);
      expect(result).toStrictEqual(false);
    });
  });

  describe('isValidHexAddress', function () {
    it('should allow 40-char non-prefixed hex', function () {
      const address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b825';
      const result = isValidHexAddress(address);
      expect(result).toStrictEqual(true);
    });

    it('should allow 42-char prefixed hex', function () {
      const address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825';
      const result = isValidHexAddress(address);
      expect(result).toStrictEqual(true);
    });

    it('should NOT allow 40-char non-prefixed hex when allowNonPrefixed is false', function () {
      const address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b825';
      const result = isValidHexAddress(address, { allowNonPrefixed: false });
      expect(result).toStrictEqual(false);
    });

    it('should NOT allow any length of non hex-prefixed string', function () {
      const address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b85';
      const result = isValidHexAddress(address);
      expect(result).toStrictEqual(false);
    });

    it('should NOT allow less than 42 character hex-prefixed string', function () {
      const address = '0xfdea65ce26263f6d9a1b5de9555d2931a33b85';
      const result = isValidHexAddress(address);
      expect(result).toStrictEqual(false);
    });

    it('should recognize correct capitalized checksum', function () {
      const address = '0xFDEa65C8e26263F6d9A1B5de9555D2931A33b825';
      const result = isValidHexAddress(address, { mixedCaseUseChecksum: true });
      expect(result).toStrictEqual(true);
    });

    it('should recognize incorrect capitalized checksum', function () {
      const address = '0xFDea65C8e26263F6d9A1B5de9555D2931A33b825';
      const result = isValidHexAddress(address, { mixedCaseUseChecksum: true });
      expect(result).toStrictEqual(false);
    });

    it('should recognize this sample hashed address', function () {
      const address = '0x5Fda30Bb72B8Dfe20e48A00dFc108d0915BE9Bb0';
      const result = isValidHexAddress(address, { mixedCaseUseChecksum: true });
      const hashed = toChecksumAddress(address.toLowerCase());
      expect(hashed).toStrictEqual(address);
      expect(result).toStrictEqual(true);
    });
  });
});
