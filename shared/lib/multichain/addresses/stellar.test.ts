import { isStellarAddress } from './stellar';

const VALID_STELLAR_ADDRESSES = [
  'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
  'GABCDEFGHJKLMNPQRSTUVWXYZ234567ABCDEFGHJKLMNPQRSTUVWXYZ2',
];

describe('Stellar Address Validator', () => {
  describe('isStellarAddress', () => {
    it('returns true for valid G-addresses', () => {
      for (const address of VALID_STELLAR_ADDRESSES) {
        expect(isStellarAddress(address)).toBe(true);
      }
    });

    it('returns false for invalid addresses', () => {
      expect(isStellarAddress('')).toBe(false);
      expect(isStellarAddress('invalid')).toBe(false);
      expect(isStellarAddress('TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3')).toBe(false);
      expect(isStellarAddress('MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')).toBe(
        false,
      );
    });
  });
});
