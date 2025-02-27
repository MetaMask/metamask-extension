import {
  KeyringObject,
  KeyringMetadata,
  KeyringTypes,
} from '@metamask/keyring-controller';
import { findKeyringId, findKeyringIdByAddress } from './keyring';

const mockAddress1 = '0xb1baf6a2f4a808937bb97a2f12ccf08f1233e3d9';
const mockAddress2 = '0xe9d2ba741180799e497a687c11ef9e99054ef2fa';
const mockAddress3 = '0x67b2faf7959fb61eb9746571041476bbd0672569';

const mockHdKeyring: KeyringObject = {
  type: KeyringTypes.hd,
  accounts: [mockAddress1, mockAddress2],
};
const mockSimpleKeyring: KeyringObject = {
  type: KeyringTypes.simple,
  accounts: [mockAddress3],
};
const mockHdKeyringMetadata: KeyringMetadata = { id: 'keyring-1', name: '' };
const mockSimpleKeyringMetadata: KeyringMetadata = {
  id: 'keyring-2',
  name: '',
};

const mockKeyrings: KeyringObject[] = [mockHdKeyring, mockSimpleKeyring];

const mockMetadata: KeyringMetadata[] = [
  mockHdKeyringMetadata,
  mockSimpleKeyringMetadata,
];

describe('Keyring utils', () => {
  describe('findKeyringId', () => {
    it('finds keyring by address', () => {
      expect(
        findKeyringId(mockKeyrings, mockMetadata, { address: mockAddress1 }),
      ).toBe(mockHdKeyringMetadata.id);
    });

    it('finds keyring by type', () => {
      expect(
        findKeyringId(mockKeyrings, mockMetadata, {
          type: KeyringTypes.simple,
        }),
      ).toBe(mockSimpleKeyringMetadata.id);
    });

    it('finds keyring by both address and type', () => {
      expect(
        findKeyringId(mockKeyrings, mockMetadata, {
          address: mockAddress3,
          type: KeyringTypes.simple,
        }),
      ).toBe(mockSimpleKeyringMetadata.id);
    });

    it('throws error when no selector is provided', () => {
      expect(() => findKeyringId(mockKeyrings, mockMetadata, {})).toThrow(
        'Must provide either address or type selector',
      );
    });

    it('throws error when keyring is not found', () => {
      expect(() =>
        findKeyringId(mockKeyrings, mockMetadata, {
          address: 'invalid-address',
        }),
      ).toThrow('Could not find keyring with specified criteria');
    });
  });

  describe('findKeyringIdByAddress', () => {
    it('finds keyring by address', () => {
      expect(
        findKeyringIdByAddress(mockKeyrings, mockMetadata, mockAddress2),
      ).toBe(mockHdKeyringMetadata.id);
    });

    it('throws error when address not found', () => {
      expect(() =>
        findKeyringIdByAddress(mockKeyrings, mockMetadata, 'invalid-address'),
      ).toThrow('Could not find keyring with specified criteria');
    });
  });
});
