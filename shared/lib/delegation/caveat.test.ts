import { createCaveat, getCaveatArrayPacketHash } from './caveat';
import { isHex, type Hex } from './utils';

describe('caveat', () => {
  const mockEnforcer = '0x1234567890123456789012345678901234567890' as Hex;
  const mockTerms =
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hex;
  const mockArgs = '0x1234567890abcdef' as Hex;

  describe('createCaveat', () => {
    it('should create a caveat with all parameters', () => {
      const result = createCaveat(mockEnforcer, mockTerms, mockArgs);

      expect(result).toStrictEqual({
        enforcer: mockEnforcer,
        terms: mockTerms,
        args: mockArgs,
      });
    });

    it('should create a caveat with default args', () => {
      const result = createCaveat(mockEnforcer, mockTerms);

      expect(result).toStrictEqual({
        enforcer: mockEnforcer,
        terms: mockTerms,
        args: '0x',
      });
    });
  });

  describe('getCaveatArrayPacketHash', () => {
    it('should return a valid hex string', () => {
      const caveat = createCaveat(mockEnforcer, mockTerms, mockArgs);
      const result = getCaveatArrayPacketHash([caveat]);

      expect(isHex(result)).toBe(true);
    });

    it('should return the same hash for the same caveat array', () => {
      const caveat = createCaveat(mockEnforcer, mockTerms, mockArgs);
      const result1 = getCaveatArrayPacketHash([caveat]);
      const result2 = getCaveatArrayPacketHash([caveat]);

      expect(result1).toBe(result2);
    });

    it('should return different hashes for different caveat arrays', () => {
      const caveat1 = createCaveat(mockEnforcer, mockTerms, mockArgs);
      const caveat2 = createCaveat(
        '0x0987654321098765432109876543210987654321' as Hex,
        mockTerms,
        mockArgs,
      );

      const result1 = getCaveatArrayPacketHash([caveat1]);
      const result2 = getCaveatArrayPacketHash([caveat2]);

      expect(result1).not.toBe(result2);
    });

    it('should handle multiple caveats', () => {
      const caveat1 = createCaveat(mockEnforcer, mockTerms, mockArgs);
      const caveat2 = createCaveat(
        '0x0987654321098765432109876543210987654321' as Hex,
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hex,
        mockArgs,
      );

      const result = getCaveatArrayPacketHash([caveat1, caveat2]);

      expect(isHex(result)).toBe(true);
    });

    it('should handle empty caveat array', () => {
      const result = getCaveatArrayPacketHash([]);

      expect(isHex(result)).toBe(true);
      // Empty array should hash to a specific value
      expect(result).toBe(
        '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
      );
    });

    it('should be deterministic for the same caveat array', () => {
      const caveat1 = createCaveat(mockEnforcer, mockTerms, mockArgs);
      const caveat2 = createCaveat(
        '0x0987654321098765432109876543210987654321' as Hex,
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hex,
        mockArgs,
      );

      const result1 = getCaveatArrayPacketHash([caveat1, caveat2]);
      const result2 = getCaveatArrayPacketHash([caveat1, caveat2]);

      expect(result1).toBe(result2);
    });

    it('should be sensitive to caveat order', () => {
      const caveat1 = createCaveat(mockEnforcer, mockTerms, mockArgs);
      const caveat2 = createCaveat(
        '0x0987654321098765432109876543210987654321' as Hex,
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hex,
        mockArgs,
      );

      const result1 = getCaveatArrayPacketHash([caveat1, caveat2]);
      const result2 = getCaveatArrayPacketHash([caveat2, caveat1]);

      expect(result1).not.toBe(result2);
    });
  });
});
