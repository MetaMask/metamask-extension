import {
  isEthAddress,
  normalizeAddress,
  normalizeSafeAddress,
} from './address';

type TestAddress = {
  address: string;
  normalizedAddress: string;
  checksumAddress: string;
};

const ETH_ADDRESSES = [
  // Lower-case address
  {
    address: '0x6431726eee67570bf6f0cf892ae0a3988f03903f',
    normalizedAddress: '0x6431726eee67570bf6f0cf892ae0a3988f03903f',
    checksumAddress: '0x6431726EEE67570BF6f0Cf892aE0a3988F03903F',
  },
  // Checksum address
  {
    address: '0x6431726EEE67570BF6f0Cf892aE0a3988F03903F',
    normalizedAddress: '0x6431726eee67570bf6f0cf892ae0a3988f03903f',
    checksumAddress: '0x6431726EEE67570BF6f0Cf892aE0a3988F03903F',
  },
];

const NON_EVM_ADDRESSES = [
  {
    address: '0xdeadbeef',
  },
  {
    address: 'bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2',
  },
];

describe('address', () => {
  describe('isEthAddress', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(ETH_ADDRESSES)(
      'returns true if address is an ethereum address: $address',
      ({ address }: TestAddress) => {
        expect(isEthAddress(address)).toBe(true);
        expect(isEthAddress(address.toLowerCase())).toBe(true);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(NON_EVM_ADDRESSES)(
      'returns false if address is not an ethereum address: $address',
      ({ address }: TestAddress) => {
        expect(isEthAddress(address)).toBe(false);
      },
    );
  });

  describe('normalizeAddress', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(ETH_ADDRESSES)(
      'normalizes address: $address',
      ({ address, normalizedAddress }: TestAddress) => {
        expect(normalizeAddress(address)).toBe(normalizedAddress);
        expect(normalizeAddress(address.toLowerCase())).toBe(normalizedAddress);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(NON_EVM_ADDRESSES)(
      'returns the original address if its a non-EVM address',
      ({ address }: TestAddress) => {
        expect(normalizeAddress(address)).toBe(address);
      },
    );
  });

  describe('normalizeSafeAddress', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(ETH_ADDRESSES)(
      'normalizes address to its "safe" form: $address to: $checksumAddress',
      ({ address, checksumAddress }: TestAddress) => {
        expect(normalizeSafeAddress(address)).toBe(checksumAddress);
        expect(normalizeSafeAddress(address.toLowerCase())).toBe(
          checksumAddress,
        );
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(NON_EVM_ADDRESSES)(
      'returns the original address if its a non-EVM address',
      ({ address }: TestAddress) => {
        expect(normalizeSafeAddress(address)).toBe(address);
      },
    );
  });
});
