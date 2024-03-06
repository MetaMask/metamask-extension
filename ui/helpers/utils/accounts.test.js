import {
  GOERLI_DISPLAY_NAME,
  LINEA_GOERLI_DISPLAY_NAME,
  MAINNET_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
} from '../../../shared/constants/network';
import { BackgroundColor } from '../constants/design-system';
import { KeyringType } from '../../../shared/constants/keyring';
import { HardwareKeyringNames } from '../../../shared/constants/hardware-wallets';
import mockState from '../../../test/data/mock-state.json';
import {
  getAccountLabel,
  getAccountNameErrorMessage,
  getAvatarNetworkColor,
} from './accounts';

const mockAccounts = Object.values(
  mockState.metamask.internalAccounts.accounts,
);

const mockLocalization = { t: jest.fn().mockReturnValue('Account') };

describe('Accounts', () => {
  describe('#getAccountNameErrorMessage', () => {
    it('does not allow duplicate names', () => {
      const { isValidAccountName } = getAccountNameErrorMessage(
        mockAccounts,
        mockLocalization,
        'Account 2',
        'Account 3',
      );
      expect(isValidAccountName).toBe(false);
    });

    it('does not allow reserved name patterns', () => {
      const { isValidAccountName } = getAccountNameErrorMessage(
        mockAccounts,
        mockLocalization,
        'Account 7',
        'Account 3',
      );
      expect(isValidAccountName).toBe(false);
    });

    it('does not allow reserved name patterns in lowercase', () => {
      const { isValidAccountName } = getAccountNameErrorMessage(
        mockAccounts,
        mockLocalization,
        'account 7',
        'Account 3',
      );
      expect(isValidAccountName).toBe(false);
    });

    it('allows proposed name in lowercase', () => {
      const { isValidAccountName } = getAccountNameErrorMessage(
        mockAccounts,
        mockLocalization,
        'account 3',
        'Account 3',
      );
      expect(isValidAccountName).toBe(true);
    });
  });

  describe('#getAvatarNetworkColor', () => {
    it('should return goerli', () => {
      expect(getAvatarNetworkColor(GOERLI_DISPLAY_NAME)).toStrictEqual(
        BackgroundColor.goerli,
      );
    });
    it('should return lineaGoerli', () => {
      expect(getAvatarNetworkColor(LINEA_GOERLI_DISPLAY_NAME)).toStrictEqual(
        BackgroundColor.lineaGoerli,
      );
    });
    it('should return sepolia', () => {
      expect(getAvatarNetworkColor(SEPOLIA_DISPLAY_NAME)).toStrictEqual(
        BackgroundColor.sepolia,
      );
    });
    it('should return undefined', () => {
      expect(getAvatarNetworkColor(MAINNET_DISPLAY_NAME)).toStrictEqual(
        undefined,
      );
    });
  });

  describe('#getAccountLabel', () => {
    const mockAccount = {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'Test Account',
        keyring: {
          type: KeyringType.hdKeyTree,
        },
      },
      options: {},
      methods: [
        'personal_sign',
        'eth_sign',
        'eth_signTransaction',
        'eth_signTypedData_v1',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
      ],
      type: 'eip155:eoa',
    };

    it('should return null for null account', () => {
      expect(getAccountLabel(KeyringType.qr, null)).toBeNull();
    });

    it('should return null for HD Key Tree accounts', () => {
      expect(getAccountLabel(KeyringType.hdKeyTree, mockAccount)).toBeNull();
    });

    it('should return the correct label for imported accounts', () => {
      mockAccount.metadata.keyring.type = KeyringType.imported;
      expect(getAccountLabel(KeyringType.imported, mockAccount)).toBe(
        'Imported',
      );
    });

    it('should return the correct label for QR hardware wallet', () => {
      mockAccount.metadata.keyring.type = KeyringType.qr;
      expect(getAccountLabel(KeyringType.qr, mockAccount)).toBe(
        HardwareKeyringNames.qr,
      );
    });

    it('should return the correct label for Trezor hardware wallet', () => {
      mockAccount.metadata.keyring.type = KeyringType.trezor;
      expect(getAccountLabel(KeyringType.trezor, mockAccount)).toBe(
        HardwareKeyringNames.trezor,
      );
    });

    it('should return the correct label for Ledger hardware wallet', () => {
      mockAccount.metadata.keyring.type = KeyringType.ledger;
      expect(getAccountLabel(KeyringType.ledger, mockAccount)).toBe(
        HardwareKeyringNames.ledger,
      );
    });

    it('should return the correct label for Lattice hardware wallet', () => {
      mockAccount.metadata.keyring.type = KeyringType.lattice;
      expect(getAccountLabel(KeyringType.lattice, mockAccount)).toBe(
        HardwareKeyringNames.lattice,
      );
    });

    it('should handle unhandled account types', () => {
      mockAccount.metadata.keyring.type = 'unknown';
      expect(getAccountLabel('unknown', mockAccount)).toBeNull();
    });

    describe('Snap Account Label', () => {
      const mockSnapAccountWithName = {
        ...mockAccount,
        metadata: {
          ...mockAccount.metadata,
          type: KeyringType.snap,
          snap: { name: 'Test Snap Name' },
        },
      };
      const mockSnapAccountWithoutName = {
        ...mockAccount,
        metadata: {
          ...mockAccount.metadata,
          type: KeyringType.snap,
        },
      };

      it('should return snap name with beta tag if snap name is provided', () => {
        expect(getAccountLabel(KeyringType.snap, mockSnapAccountWithName)).toBe(
          'Test Snap Name (Beta)',
        );
      });

      it('should return generic snap label with beta tag if snap name is not provided', () => {
        expect(
          getAccountLabel(KeyringType.snap, mockSnapAccountWithoutName),
        ).toBe('Snaps (Beta)');
      });
    });
  });
});
