import { isBtcMainnetAddress, isBtcTestnetAddress } from './multichain';

const MAINNET_ADDRESSES = [
  // P2WPKH
  'bc1qwl8399fz829uqvqly9tcatgrgtwp3udnhxfq4k',
  // P2PKH
  '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ',
];

const TESTNET_ADDRESSES = [
  // P2WPKH
  'tb1q6rmsq3vlfdhjdhtkxlqtuhhlr6pmj09y6w43g8',
];

const ETH_ADDRESSES = ['0x6431726EEE67570BF6f0Cf892aE0a3988F03903F'];

describe('multichain', () => {
  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(MAINNET_ADDRESSES)(
    'returns true if address is compatible with BTC mainnet: %s',
    (address: string) => {
      expect(isBtcMainnetAddress(address)).toBe(true);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([...TESTNET_ADDRESSES, ...ETH_ADDRESSES])(
    'returns false if address is not compatible with BTC mainnet: %s',
    (address: string) => {
      expect(isBtcMainnetAddress(address)).toBe(false);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(TESTNET_ADDRESSES)(
    'returns true if address is compatible with BTC testnet: %s',
    (address: string) => {
      expect(isBtcTestnetAddress(address)).toBe(true);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([...MAINNET_ADDRESSES, ...ETH_ADDRESSES])(
    'returns false if address is compatible with BTC testnet: %s',
    (address: string) => {
      expect(isBtcTestnetAddress(address)).toBe(false);
    },
  );
});
