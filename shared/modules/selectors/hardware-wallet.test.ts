import { KeyringType } from '../../constants/keyring';
import mockState from '../../../test/data/mock-state.json';
import type { SelectedInternalAccountState } from './accounts';
import {
  getCurrentKeyring,
  getHardwareWalletType,
  isHardwareWallet,
} from './hardware-wallet';

const buildStateWithKeyringType = (keyringType: string) => {
  const state = structuredClone(
    mockState,
  ) as unknown as SelectedInternalAccountState & {
    metamask: {
      internalAccounts: {
        selectedAccount: string;
        accounts: Record<string, { metadata: { keyring: { type: string } } }>;
      };
    };
  };

  state.metamask.internalAccounts.accounts[
    state.metamask.internalAccounts.selectedAccount
  ].metadata.keyring.type = keyringType;

  return state;
};

describe('Hardware Wallet Selectors', () => {
  describe('getCurrentKeyring', () => {
    it('returns null when no account is selected', () => {
      const state = {
        metamask: {
          internalAccounts: {
            accounts: {},
            selectedAccount: '',
          },
        },
      } as unknown as SelectedInternalAccountState;

      expect(getCurrentKeyring(state)).toBeNull();
    });

    it('returns the selected account keyring', () => {
      const state = mockState as unknown as SelectedInternalAccountState;
      const selectedAccount =
        state.metamask.internalAccounts.accounts[
          state.metamask.internalAccounts.selectedAccount
        ];

      expect(getCurrentKeyring(state)).toStrictEqual(
        selectedAccount.metadata?.keyring,
      );
    });
  });

  describe('isHardwareWallet', () => {
    it('returns false for non-hardware keyrings', () => {
      const state = buildStateWithKeyringType(KeyringType.imported);

      expect(isHardwareWallet(state)).toBe(false);
    });

    it.each([
      KeyringType.ledger,
      KeyringType.trezor,
      KeyringType.lattice,
      KeyringType.qr,
    ])('returns true for hardware keyring "%s"', (keyringType) => {
      const state = buildStateWithKeyringType(keyringType);

      expect(isHardwareWallet(state)).toBe(true);
    });
  });

  describe('getHardwareWalletType', () => {
    it('returns undefined for non-hardware keyrings', () => {
      const state = buildStateWithKeyringType(KeyringType.imported);

      expect(getHardwareWalletType(state)).toBeUndefined();
    });

    it.each([KeyringType.ledger, KeyringType.trezor])(
      'returns the keyring type for hardware keyring "%s"',
      (keyringType) => {
        const state = buildStateWithKeyringType(keyringType);

        expect(getHardwareWalletType(state)).toBe(keyringType);
      },
    );
  });
});
