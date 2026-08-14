import type { Transaction } from '@metamask/keyring-api';
import {
  collectTransactionTokenScanKeys,
  filterMaliciousTransactions,
  generateTokenCacheKey,
  type MultichainTokenScanKey,
} from './token-scan';

describe('token-scan', () => {
  describe('generateTokenCacheKey', () => {
    it('normalizes chain ID and token address casing', () => {
      expect(generateTokenCacheKey('Solana:Mainnet', 'BadMint111')).toBe(
        'solana:mainnet:badmint111',
      );
    });
  });

  describe('non-EVM malicious token filtering', () => {
    const maliciousTokenKeys = new Set<MultichainTokenScanKey>([
      'solana:mainnet:badmint111',
    ]);

    it('collects unique token scan keys from token movements and fees', () => {
      const tx = {
        from: [
          {
            asset: {
              fungible: true,
              type: 'solana:mainnet/token:BadMint111',
            },
          },
        ],
        to: [
          {
            asset: {
              fungible: true,
              type: 'solana:mainnet/token:BadMint111',
            },
          },
          {
            asset: {
              fungible: true,
              type: 'solana:mainnet/slip44:501',
            },
          },
        ],
        fees: [
          {
            asset: {
              fungible: true,
              type: 'solana:mainnet/token:GoodMint222',
            },
          },
        ],
      } as unknown as Transaction;

      expect(collectTransactionTokenScanKeys(tx)).toEqual([
        'solana:mainnet:badmint111',
        'solana:mainnet:goodmint222',
      ]);
    });

    it('filters out only malicious non-EVM transactions', () => {
      const maliciousTx = {
        id: 'malicious-tx',
        from: [
          {
            asset: {
              fungible: true,
              type: 'solana:mainnet/token:BadMint111',
            },
          },
        ],
        to: [],
      } as unknown as Transaction;
      const benignTx = {
        id: 'benign-tx',
        from: [
          {
            asset: {
              fungible: true,
              type: 'solana:mainnet/token:GoodMint222',
            },
          },
        ],
        to: [],
      } as unknown as Transaction;
      const nativeOnlyTx = {
        id: 'native-only-tx',
        from: [
          {
            asset: {
              fungible: true,
              type: 'solana:mainnet/slip44:501',
            },
          },
        ],
        to: [],
      } as unknown as Transaction;

      expect(
        filterMaliciousTransactions(
          [maliciousTx, benignTx, nativeOnlyTx],
          maliciousTokenKeys,
        ),
      ).toEqual([benignTx, nativeOnlyTx]);
    });
  });
});
