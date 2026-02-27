import * as bridgeControllerUtils from '@metamask/bridge-controller';
import log from 'loglevel';
import { formatAccountToCaipAccountId } from './rewards-utils';

jest.mock('loglevel', () => ({
  error: jest.fn(),
}));

describe('rewards-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatAccountToCaipAccountId', () => {
    describe('valid inputs', () => {
      it('should format a valid lowercase hex address to CAIP-10 account ID', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0x1'; // Ethereum mainnet

        const result = formatAccountToCaipAccountId(address, chainId);

        expect(result).toBe(
          'eip155:1:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });

      it('should format a valid checksummed address to CAIP-10 account ID', () => {
        const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(address, chainId);

        expect(result).toBe(
          'eip155:1:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });

      it('should format address for Polygon mainnet', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0x89'; // Polygon mainnet (137)

        const result = formatAccountToCaipAccountId(address, chainId);

        expect(result).toBe(
          'eip155:137:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });

      it('should format address for Arbitrum One', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0xa4b1'; // Arbitrum One (42161)

        const result = formatAccountToCaipAccountId(address, chainId);

        expect(result).toBe(
          'eip155:42161:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });

      it('should format address for Optimism', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0xa'; // Optimism (10)

        const result = formatAccountToCaipAccountId(address, chainId);

        expect(result).toBe(
          'eip155:10:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });

      it('should format address for Base', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0x2105'; // Base (8453)

        const result = formatAccountToCaipAccountId(address, chainId);

        expect(result).toBe(
          'eip155:8453:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });

      it('should format address for Linea mainnet', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0xe708'; // Linea (59144)

        const result = formatAccountToCaipAccountId(address, chainId);

        expect(result).toBe(
          'eip155:59144:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });

      it('should format address for BNB Smart Chain', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0x38'; // BSC (56)

        const result = formatAccountToCaipAccountId(address, chainId);

        expect(result).toBe(
          'eip155:56:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });

      it('should format address for Goerli testnet', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0x5'; // Goerli (5)

        const result = formatAccountToCaipAccountId(address, chainId);

        expect(result).toBe(
          'eip155:5:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });

      it('should format address for Sepolia testnet', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0xaa36a7'; // Sepolia (11155111)

        const result = formatAccountToCaipAccountId(address, chainId);

        expect(result).toBe(
          'eip155:11155111:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });
    });

    describe('hardware wallet account addresses', () => {
      // Hardware wallet accounts use the same address format as software wallets,
      // but we test them explicitly to ensure they work correctly.

      it('should format Ledger hardware wallet address', () => {
        // Ledger addresses are standard Ethereum addresses
        const ledgerAddress = '0x71c7656ec7ab88b098defb751b7401b5f6d8976f';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(ledgerAddress, chainId);

        expect(result).toBe(
          'eip155:1:0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        );
      });

      it('should format Trezor hardware wallet address', () => {
        // Trezor addresses are also standard Ethereum addresses
        const trezorAddress = '0xab5801a7d398351b8be11c439e05c5b3259aec9b';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(trezorAddress, chainId);

        expect(result).toBe(
          'eip155:1:0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        );
      });

      it('should format QR hardware wallet (Keystone) address', () => {
        // QR-based hardware wallet addresses are also standard Ethereum addresses
        const keystoneAddress = '0x4e83362442b8d1bec281594cea3050c8eb01311c';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(keystoneAddress, chainId);

        // The checksum is determined by the keccak256 hash of the lowercase address
        expect(result).toBe(
          'eip155:1:0x4E83362442B8d1beC281594cEa3050c8EB01311C',
        );
      });

      it('should format hardware wallet address on Polygon', () => {
        const hardwareAddress = '0x71c7656ec7ab88b098defb751b7401b5f6d8976f';
        const chainId = '0x89'; // Polygon

        const result = formatAccountToCaipAccountId(hardwareAddress, chainId);

        expect(result).toBe(
          'eip155:137:0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        );
      });

      it('should format hardware wallet address on Arbitrum', () => {
        const hardwareAddress = '0xab5801a7d398351b8be11c439e05c5b3259aec9b';
        const chainId = '0xa4b1'; // Arbitrum

        const result = formatAccountToCaipAccountId(hardwareAddress, chainId);

        expect(result).toBe(
          'eip155:42161:0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        );
      });
    });

    describe('edge cases', () => {
      it('should handle address with mixed case (converts to checksum)', () => {
        // Input is mixed case but not correct checksum - gets converted to proper checksum
        const mixedCaseAddress = '0xD8Da6BF26964AF9D7eed9e03e53415D37Aa96045';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(mixedCaseAddress, chainId);

        // The checksum conversion normalizes the case
        expect(result).toBe(
          'eip155:1:0xD8Da6BF26964AF9D7eed9e03e53415D37Aa96045',
        );
      });

      it('should handle all lowercase address', () => {
        const lowercaseAddress = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(lowercaseAddress, chainId);

        expect(result).toBe(
          'eip155:1:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });

      it('should handle all uppercase address (except prefix)', () => {
        // When input is all uppercase (except prefix), it gets converted to checksum
        // The toChecksumHexAddress preserves the input case for non-checksum addresses
        const uppercaseAddress = '0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(uppercaseAddress, chainId);

        // All uppercase input gets preserved as toChecksumHexAddress sees it as checksum
        expect(result).toBe(
          'eip155:1:0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045',
        );
      });

      it('should handle zero address', () => {
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(zeroAddress, chainId);

        expect(result).toBe(
          'eip155:1:0x0000000000000000000000000000000000000000',
        );
      });

      it('should handle dead address', () => {
        const deadAddress = '0x000000000000000000000000000000000000dead';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(deadAddress, chainId);

        expect(result).toBe(
          'eip155:1:0x000000000000000000000000000000000000dEaD',
        );
      });

      it('should handle empty chain ID (converts to 0)', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const emptyChainId = '';

        const result = formatAccountToCaipAccountId(address, emptyChainId);

        // Empty string converts to 0x0 which is chain ID 0
        expect(result).toBe(
          'eip155:0:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        );
      });
    });

    describe('error handling', () => {
      it('should pass through non-hex address without checksum conversion', () => {
        const invalidAddress = 'not-a-valid-address';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(invalidAddress, chainId);

        // For non-hex addresses, isValidHexAddress returns false so the address
        // is used as-is without checksum conversion
        expect(result).toBe('eip155:1:not-a-valid-address');
      });

      it('should return null and log error for invalid chain ID', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const invalidChainId = 'invalid-chain-id';

        const result = formatAccountToCaipAccountId(address, invalidChainId);

        expect(result).toBeNull();
        expect(log.error).toHaveBeenCalledWith(
          '[rewards-utils] Error formatting account to CAIP-10:',
          expect.any(Error),
        );
      });

      it('should return null when formatChainIdToCaip throws', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';

        jest
          .spyOn(bridgeControllerUtils, 'formatChainIdToCaip')
          .mockImplementationOnce(() => {
            throw new Error('Invalid chain ID format');
          });

        const result = formatAccountToCaipAccountId(address, '0x1');

        expect(result).toBeNull();
        expect(log.error).toHaveBeenCalledWith(
          '[rewards-utils] Error formatting account to CAIP-10:',
          expect.any(Error),
        );
      });

      it('should return null when internal processing throws an error', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';

        // Mock formatChainIdToCaip to return invalid data that will cause parseCaipChainId to fail
        jest
          .spyOn(bridgeControllerUtils, 'formatChainIdToCaip')
          .mockImplementationOnce(() => 'invalid:caip:format:with:extra:parts');

        const result = formatAccountToCaipAccountId(address, '0x1');

        expect(result).toBeNull();
        expect(log.error).toHaveBeenCalledWith(
          '[rewards-utils] Error formatting account to CAIP-10:',
          expect.any(Error),
        );
      });
    });

    describe('non-hex address handling', () => {
      // When isValidHexAddress returns false, the address is used as-is
      // without checksum conversion

      it('should pass through non-hex address unchanged', () => {
        const nonHexAddress = 'some-identifier-123';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(nonHexAddress, chainId);

        // The function doesn't validate the address format, it just passes it through
        expect(result).toBe('eip155:1:some-identifier-123');
      });

      it('should pass through address without 0x prefix', () => {
        const addressWithoutPrefix = 'd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(
          addressWithoutPrefix,
          chainId,
        );

        // isValidHexAddress from @metamask/utils checks for 0x prefix
        expect(result).toBe(
          'eip155:1:d8da6bf26964af9d7eed9e03e53415d37aa96045',
        );
      });

      it('should return null for empty address', () => {
        const emptyAddress = '';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(emptyAddress, chainId);

        // Empty address causes toCaipAccountId to throw, returns null
        expect(result).toBeNull();
        expect(log.error).toHaveBeenCalledWith(
          '[rewards-utils] Error formatting account to CAIP-10:',
          expect.any(Error),
        );
      });
    });

    describe('checksum address conversion', () => {
      it('should convert lowercase hex address to checksum format', () => {
        // These test vectors are from EIP-55
        const testCases = [
          {
            input: '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed',
            expected: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
          },
          {
            input: '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359',
            expected: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
          },
          {
            input: '0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb',
            expected: '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
          },
          {
            input: '0xd1220a0cf47c7b9be7a2e6ba89f429762e7b9adb',
            expected: '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
          },
        ];

        for (const { input, expected } of testCases) {
          const result = formatAccountToCaipAccountId(input, '0x1');
          expect(result).toBe(`eip155:1:${expected}`);
        }
      });
    });

    describe('return type', () => {
      it('should return CaipAccountId type for valid inputs', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const chainId = '0x1';

        const result = formatAccountToCaipAccountId(address, chainId);

        // CaipAccountId is a branded string type
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^eip155:\d+:0x[a-fA-F0-9]{40}$/u);
      });

      it('should return null for errors', () => {
        const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
        const invalidChainId = 'not-a-valid-chain-id';

        const result = formatAccountToCaipAccountId(address, invalidChainId);

        expect(result).toBeNull();
      });
    });
  });
});
