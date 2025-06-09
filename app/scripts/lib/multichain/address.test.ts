import {
  isEthAddress,
  normalizeAddress,
  normalizeSafeAddress,
} from './address';

describe('address', () => {
  const TEST_CASES_EVM_ADDRESSES = [
    {
      address: '0x6431726eee67570bf6f0cf892ae0a3988f03903f', // Lower-case address
      normalizedAddress: '0x6431726eee67570bf6f0cf892ae0a3988f03903f',
      checksumAddress: '0x6431726EEE67570BF6f0Cf892aE0a3988F03903F',
    },
    {
      address: '0x6431726EEE67570BF6f0Cf892aE0a3988F03903F', // Checksum address
      normalizedAddress: '0x6431726eee67570bf6f0cf892ae0a3988f03903f',
      checksumAddress: '0x6431726EEE67570BF6f0Cf892aE0a3988F03903F',
    },
  ];

  const TEST_CASES_NON_EVM_ADDRESSES = [
    '0xdeadbeef',
    'bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2',
  ];

  describe('isEthAddress', () => {
    it.each(TEST_CASES_EVM_ADDRESSES)(
      'returns true if address is an ethereum address: $address',
      ({ address }) => {
        expect(isEthAddress(address)).toBe(true);
        expect(isEthAddress(address.toLowerCase())).toBe(true);
      },
    );

    it.each(TEST_CASES_NON_EVM_ADDRESSES)(
      'returns false if address is not an ethereum address: $address',
      (address) => {
        expect(isEthAddress(address)).toBe(false);
      },
    );
  });

  describe('normalizeAddress', () => {
    it.each(TEST_CASES_EVM_ADDRESSES)(
      'normalizes address: $address',
      ({ address, normalizedAddress }) => {
        expect(normalizeAddress(address)).toBe(normalizedAddress);
        expect(normalizeAddress(address.toLowerCase())).toBe(normalizedAddress);
      },
    );

    it.each(TEST_CASES_NON_EVM_ADDRESSES)(
      'returns the original address if its a non-EVM address',
      (address) => {
        expect(normalizeAddress(address)).toBe(address);
      },
    );
  });

  describe('normalizeSafeAddress', () => {
    it.each(TEST_CASES_EVM_ADDRESSES)(
      'normalizes address to its "safe" form: $address to: $checksumAddress',
      ({ address, checksumAddress }) => {
        expect(normalizeSafeAddress(address)).toBe(checksumAddress);
        expect(normalizeSafeAddress(address.toLowerCase())).toBe(
          checksumAddress,
        );
      },
    );

    it.each(TEST_CASES_NON_EVM_ADDRESSES)(
      'returns the original address if its a non-EVM address',
      (address) => {
        expect(normalizeSafeAddress(address)).toBe(address);
      },
    );
  });
});
