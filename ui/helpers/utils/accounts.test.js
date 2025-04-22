import {
  GOERLI_DISPLAY_NAME,
  LINEA_GOERLI_DISPLAY_NAME,
  LINEA_SEPOLIA_DISPLAY_NAME,
  MAINNET_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
} from '../../../shared/constants/network';
import { BackgroundColor } from '../constants/design-system';
import { KeyringType } from '../../../shared/constants/keyring';
import { HardwareKeyringNames } from '../../../shared/constants/hardware-wallets';
import mockState from '../../../test/data/mock-state.json';
import {
  getAccountLabels,
  getAccountNameErrorMessage,
  getAvatarNetworkColor,
} from './accounts';

const mockAccounts = Object.values(
  mockState.metamask.internalAccounts.accounts,
);

const mockLocalization = { t: jest.fn().mockReturnValue('Account') };

const keyringsWithMetadata = [
  {
    type: KeyringType.hdKeyTree,
    metadata: { id: 'hdKeyring1' },
  },
  {
    type: KeyringType.hdKeyTree,
    metadata: { id: 'hdKeyring2' },
  },
];

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
    it('should return lineaSepolia', () => {
      expect(getAvatarNetworkColor(LINEA_SEPOLIA_DISPLAY_NAME)).toStrictEqual(
        BackgroundColor.lineaSepolia,
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

  describe('#getAccountLabels', () => {
    const mockAccount = {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'Test Account',
        keyring: {
          type: KeyringType.hdKeyTree,
        },
        snap: {
          id: 'npm:@metamask/solana-wallet-snap',
        },
      },
      options: {},
      methods: [
        'personal_sign',
        'eth_signTransaction',
        'eth_signTypedData_v1',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
      ],
      type: 'eip155:eoa',
    };

    it('should return empty array for null account', () => {
      expect(
        getAccountLabels(KeyringType.qr, null, keyringsWithMetadata),
      ).toStrictEqual([]);
    });

    it('should return empty array for HD Key Tree accounts', () => {
      expect(
        getAccountLabels(KeyringType.hdKeyTree, mockAccount, []),
      ).toStrictEqual([]);
    });

    it('should return the correct label for imported accounts', () => {
      mockAccount.metadata.keyring.type = KeyringType.imported;
      expect(
        getAccountLabels(
          KeyringType.imported,
          mockAccount,
          keyringsWithMetadata,
        ),
      ).toStrictEqual(['Imported']);
    });

    it('should return the correct label for QR hardware wallet', () => {
      mockAccount.metadata.keyring.type = KeyringType.qr;
      expect(
        getAccountLabels(KeyringType.qr, mockAccount, keyringsWithMetadata),
      ).toStrictEqual([HardwareKeyringNames.qr]);
    });

    it('should return the correct label for Trezor hardware wallet', () => {
      mockAccount.metadata.keyring.type = KeyringType.trezor;
      expect(
        getAccountLabels(KeyringType.trezor, mockAccount, keyringsWithMetadata),
      ).toStrictEqual([HardwareKeyringNames.trezor]);
    });

    it('should return the correct label for OneKey hardware wallet', () => {
      mockAccount.metadata.keyring.type = KeyringType.oneKey;
      expect(
        getAccountLabels(KeyringType.oneKey, mockAccount, keyringsWithMetadata),
      ).toStrictEqual([HardwareKeyringNames.oneKey]);
    });

    it('should return the correct label for Ledger hardware wallet', () => {
      mockAccount.metadata.keyring.type = KeyringType.ledger;
      expect(
        getAccountLabels(KeyringType.ledger, mockAccount, keyringsWithMetadata),
      ).toStrictEqual([HardwareKeyringNames.ledger]);
    });

    it('should return the correct label for Lattice hardware wallet', () => {
      mockAccount.metadata.keyring.type = KeyringType.lattice;
      expect(
        getAccountLabels(
          KeyringType.lattice,
          mockAccount,
          keyringsWithMetadata,
        ),
      ).toStrictEqual([HardwareKeyringNames.lattice]);
    });

    it('should handle unhandled account types', () => {
      mockAccount.metadata.keyring.type = 'unknown';
      expect(
        getAccountLabels('unknown', mockAccount, keyringsWithMetadata),
      ).toStrictEqual([]);
    });

    describe('Snap Account Label', () => {
      const mockSnapName = 'Test Snap Name';
      const mockSnapAccountWithName = {
        ...mockAccount,
        metadata: {
          ...mockAccount.metadata,
          type: KeyringType.snap,
          snap: {
            name: mockSnapName,
            id: 'npm:@metamask/solana-wallet-snap',
          },
        },
      };
      const mockSnapAccountWithoutName = {
        ...mockAccount,
        metadata: {
          ...mockAccount.metadata,
          type: KeyringType.snap,
        },
      };

      it('should not return snap name with beta tag if snap name is provided but the snap is preinstalled', () => {
        expect(
          getAccountLabels(
            KeyringType.snap,
            mockSnapAccountWithName,
            keyringsWithMetadata,
            mockSnapName,
            false,
          ),
        ).toStrictEqual([]);
      });

      it('should not return generic snap label with beta tag if snap name is not provided and the snap is preinstalled', () => {
        expect(
          getAccountLabels(
            KeyringType.snap,
            mockSnapAccountWithoutName,
            keyringsWithMetadata,
            false,
          ),
        ).toStrictEqual([]);
      });

      it('should return empty array if snap is preinstalled', () => {
        expect(
          getAccountLabels(
            KeyringType.snap,
            mockSnapAccountWithName,
            keyringsWithMetadata,
            mockSnapName,
            true,
          ),
        ).toStrictEqual([]);
      });
    });
  });

  describe('SRP label', () => {
    it('should show SRP label with index when there are multiple HD keyrings', () => {
      const mockAccountWithHdKeyring = {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        metadata: {
          keyring: { type: KeyringType.hdKeyTree },
          snap: {
            id: 'npm:@metamask/solana-wallet-snap',
          },
        },
      };

      const multipleHdKeyrings = [
        {
          type: KeyringType.hdKeyTree,
          accounts: ['0x123'],
        },
        {
          type: KeyringType.hdKeyTree,
          accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
        },
      ];

      expect(
        getAccountLabels(
          KeyringType.hdKeyTree,
          mockAccountWithHdKeyring,
          multipleHdKeyrings,
        ),
      ).toStrictEqual(['SRP #2']);
    });

    it('should not show SRP label when there is only one HD keyring', () => {
      const mockAccountWithHdKeyring = {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        metadata: {
          keyring: { type: KeyringType.hdKeyTree },
          snap: {
            id: 'npm:@metamask/solana-wallet-snap',
          },
        },
      };

      const singleHdKeyring = [
        {
          type: KeyringType.hdKeyTree,
          accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
        },
      ];

      expect(
        getAccountLabels(
          KeyringType.hdKeyTree,
          mockAccountWithHdKeyring,
          singleHdKeyring,
        ),
      ).toStrictEqual([]);
    });

    it('should show SRP label for snap accounts with entropySource matching HD keyring', () => {
      const mockSnapAccount = {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        options: {
          entropySource: 'hdKeyring2',
        },
        metadata: {
          keyring: { type: KeyringType.snap },
          snap: {
            id: 'npm:@metamask/solana-wallet-snap',
          },
        },
      };

      expect(
        getAccountLabels(
          KeyringType.snap,
          mockSnapAccount,
          keyringsWithMetadata,
          'Test Snap',
        ),
      ).toStrictEqual(['SRP #2']);
    });
  });
});
