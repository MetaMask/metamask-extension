import { KnownCaipNamespace } from '@metamask/utils';
import {
  getCaipNamespaceFromAddress,
  isBtcMainnetAddress,
  isBtcTestnetAddress,
  isSolanaAddress,
} from './accounts';

const BTC_MAINNET_ADDRESSES = [
  // P2WPKH
  'bc1qwl8399fz829uqvqly9tcatgrgtwp3udnhxfq4k',
  // P2PKH
  '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ',
];

const BTC_TESTNET_ADDRESSES = [
  // P2WPKH
  'tb1q6rmsq3vlfdhjdhtkxlqtuhhlr6pmj09y6w43g8',
];

const ETH_ADDRESSES = ['0x6431726EEE67570BF6f0Cf892aE0a3988F03903F'];

const SOL_ADDRESSES = [
  '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
  'DpNXPNWvWoHaZ9P3WtfGCb2ZdLihW8VW1w1Ph4KDH9iG',
];

describe('multichain', () => {
  describe('isBtcMainnetAddress', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(BTC_MAINNET_ADDRESSES)(
      'returns true if address is compatible with BTC mainnet: %s',
      (address: string) => {
        expect(isBtcMainnetAddress(address)).toBe(true);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([...BTC_TESTNET_ADDRESSES, ...ETH_ADDRESSES, ...SOL_ADDRESSES])(
      'returns false if address is not compatible with BTC mainnet: %s',
      (address: string) => {
        expect(isBtcMainnetAddress(address)).toBe(false);
      },
    );
  });

  describe('isBtcTestnetAddress', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(BTC_TESTNET_ADDRESSES)(
      'returns true if address is compatible with BTC testnet: %s',
      (address: string) => {
        expect(isBtcTestnetAddress(address)).toBe(true);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([...BTC_MAINNET_ADDRESSES, ...ETH_ADDRESSES, ...SOL_ADDRESSES])(
      'returns false if address is compatible with BTC testnet: %s',
      (address: string) => {
        expect(isBtcTestnetAddress(address)).toBe(false);
      },
    );
  });

  describe('isSolanaAddress', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(SOL_ADDRESSES)(
      'returns true if address is a valid Solana address: %s',
      (address: string) => {
        expect(isSolanaAddress(address)).toBe(true);
      },
    );

    it('should return false for invalid Solana addresses', () => {
      expect(isSolanaAddress('invalid')).toBe(false);
    });
  });

  describe('getCaipNamespaceFromAddress', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([...BTC_MAINNET_ADDRESSES, ...BTC_TESTNET_ADDRESSES])(
      'returns KnownCaipNamespace.Bip122 for bitcoin address: %s',
      (address: string) => {
        expect(getCaipNamespaceFromAddress(address)).toBe(
          KnownCaipNamespace.Bip122,
        );
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(ETH_ADDRESSES)(
      'returns KnownCaipNamespace.Eip155 for ethereum address: %s',
      (address: string) => {
        expect(getCaipNamespaceFromAddress(address)).toBe(
          KnownCaipNamespace.Eip155,
        );
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(SOL_ADDRESSES)(
      'returns KnownCaipNamespace.Solana for non-supported address: %s',
      (address: string) => {
        expect(getCaipNamespaceFromAddress(address)).toBe(
          KnownCaipNamespace.Solana,
        );
      },
    );
  });
});
