import { computeCalldataDigest, computeEIP712Digest } from './digest';

describe('ERC-8213 Digest Functions', () => {
  describe('computeCalldataDigest', () => {
    it('matches the ERC-8213 test vector for ERC-20 transfer', () => {
      // ERC-20 transfer(address,uint256) calldata from the ERC spec
      const calldata =
        '0xa9059cbb0000000000000000000000004675c7e5baafbffbca748158becba61ef3b0a2630000000000000000000000000000000000000000000000000de0b6b3a7640000';

      const digest = computeCalldataDigest(calldata);

      expect(digest).toBe(
        '0x812cee5d9cc7461c04bbcd7b70af9c28b243ac5d74d3453b008b93b7dac69985',
      );
    });

    it('produces different digests for different calldata', () => {
      const calldata1 = '0xabcdef';
      const calldata2 = '0xabcdef00';

      const digest1 = computeCalldataDigest(calldata1);
      const digest2 = computeCalldataDigest(calldata2);

      expect(digest1).not.toBe(digest2);
    });

    it('handles minimal calldata', () => {
      const calldata = '0x12345678';
      const digest = computeCalldataDigest(calldata);

      expect(digest).toMatch(/^0x[0-9a-f]{64}$/u);
    });
  });

  describe('computeEIP712Digest', () => {
    it('produces a valid 32-byte digest', () => {
      const domainSeparator =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const messageHash =
        '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

      const digest = computeEIP712Digest(domainSeparator, messageHash);

      expect(digest).toMatch(/^0x[0-9a-f]{64}$/u);
    });

    it('accepts hex strings without 0x prefix', () => {
      const domainSeparator =
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const messageHash =
        'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

      const digest = computeEIP712Digest(domainSeparator, messageHash);

      expect(digest).toMatch(/^0x[0-9a-f]{64}$/u);
    });

    it('produces consistent results for same inputs', () => {
      const domainSeparator =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const messageHash =
        '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

      const digest1 = computeEIP712Digest(domainSeparator, messageHash);
      const digest2 = computeEIP712Digest(domainSeparator, messageHash);

      expect(digest1).toBe(digest2);
    });
  });
});
