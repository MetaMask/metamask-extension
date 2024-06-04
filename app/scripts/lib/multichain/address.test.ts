import { stripHexPrefix } from '../../../../shared/modules/hexstring-utils';
import {
  isEthAddress,
  normalizeAddress,
  normalizeSafeAddress,
} from './address';

const ETH_ADDRESSES = [
  {
    address: '0x6431726eee67570bf6f0cf892ae0a3988f03903f',
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

function toLowerCaseEthAddress(address: string) {
  return `0x${stripHexPrefix(address).toLowerCase()}`;
}

function toUpperCaseEthAddress(address: string) {
  return `0x${stripHexPrefix(address).toUpperCase()}`;
}

describe('address', () => {
  describe('isEthAddress', () => {
    it.each(ETH_ADDRESSES)(
      'returns true if address is an ethereum address: $address',
      ({ address }) => {
        expect(isEthAddress(address)).toBe(true);
        expect(isEthAddress(toLowerCaseEthAddress(address))).toBe(true);
        expect(isEthAddress(toUpperCaseEthAddress(address))).toBe(true);
      },
    );

    it.each(NON_EVM_ADDRESSES)(
      'returns false if address is not an ethereum address: $address',
      ({ address }) => {
        expect(isEthAddress(address)).toBe(false);
      },
    );
  });

  describe('normalizeAddress', () => {
    it.each(ETH_ADDRESSES)('normalizes address: $address', ({ address }) => {
      expect(normalizeAddress(address)).toBe(address);
      expect(normalizeAddress(toLowerCaseEthAddress(address))).toBe(address);
      expect(normalizeAddress(toUpperCaseEthAddress(address))).toBe(address);
    });

    it.each(NON_EVM_ADDRESSES)(
      'returns the original address if its a non-EVM address',
      ({ address }) => {
        expect(normalizeAddress(address)).toBe(address);
      },
    );
  });

  describe('normalizeSafeAddress', () => {
    it.each(ETH_ADDRESSES)(
      'normalizes address to its "safe" form: $address to: $checksumAddress',
      ({ address, checksumAddress }) => {
        expect(normalizeSafeAddress(address)).toBe(checksumAddress);
        expect(normalizeSafeAddress(toLowerCaseEthAddress(address))).toBe(
          checksumAddress,
        );
        expect(normalizeSafeAddress(toUpperCaseEthAddress(address))).toBe(
          checksumAddress,
        );
      },
    );

    it.each(NON_EVM_ADDRESSES)(
      'returns the original address if its a non-EVM address',
      ({ address }) => {
        expect(normalizeSafeAddress(address)).toBe(address);
      },
    );
  });
});
