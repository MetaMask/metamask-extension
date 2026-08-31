import {
  AccountGroupType,
  AccountWalletType,
  toAccountGroupId,
  toAccountWalletId,
  toMultichainAccountGroupId,
  toMultichainAccountWalletId,
} from '@metamask/account-api';
import type {
  AccountGroupObject,
  AccountWalletObject,
} from '@metamask/account-tree-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import {
  isHardwareWallet,
  isImportedWallet,
  projectAccountManagementSections,
} from './account-management-list.utils';

describe('account-management-list.utils', () => {
  type AccountWalletEntropy = Extract<
    AccountWalletObject,
    { type: AccountWalletType.Entropy }
  >;
  type AccountWalletKeyring = Extract<
    AccountWalletObject,
    { type: AccountWalletType.Keyring }
  >;

  const createMockEntropyWallet = (
    id: string,
    name: string,
    groups: Record<string, { name: string; pinned?: boolean; hidden?: boolean }>,
    status: AccountWalletEntropy['status'] = 'ready',
  ): AccountWalletEntropy => {
    const walletId = toMultichainAccountWalletId(id);
    const walletGroups: AccountWalletEntropy['groups'] = {};

    Object.entries(groups).forEach(([, groupMeta], index) => {
      const groupId = toMultichainAccountGroupId(walletId, index);
      const accounts: [string, ...string[]] = ['0x1'];
      walletGroups[groupId] = {
        id: groupId,
        type: AccountGroupType.MultichainAccount,
        metadata: {
          name: groupMeta.name,
          pinned: groupMeta.pinned ?? false,
          hidden: groupMeta.hidden ?? false,
          lastSelected: 0,
          entropy: { groupIndex: index },
        },
        accounts,
      };
    });

    return {
      id: walletId,
      type: AccountWalletType.Entropy,
      status,
      metadata: {
        name,
        entropy: {
          id,
        },
      },
      groups: walletGroups,
    };
  };

  const createMockKeyringWallet = (
    keyringType: KeyringTypes,
    groups: Record<string, { name: string; pinned?: boolean; hidden?: boolean }>,
  ): AccountWalletKeyring => {
    const walletId = toAccountWalletId(AccountWalletType.Keyring, keyringType);
    const walletGroups: AccountWalletKeyring['groups'] = {};

    Object.entries(groups).forEach(([groupSuffix, groupMeta]) => {
      const groupId = toAccountGroupId(walletId, groupSuffix);
      const accounts: [string] = ['0x1'];
      walletGroups[groupId] = {
        id: groupId,
        type: AccountGroupType.SingleAccount,
        metadata: {
          name: groupMeta.name,
          pinned: groupMeta.pinned ?? false,
          hidden: groupMeta.hidden ?? false,
          lastSelected: 0,
        },
        accounts,
      };
    });

    return {
      id: walletId,
      type: AccountWalletType.Keyring,
      status: 'ready',
      metadata: {
        name: keyringType,
        keyring: {
          type: keyringType,
        },
      },
      groups: walletGroups,
    };
  };

  describe('isHardwareWallet', () => {
    it('returns true for hardware keyrings', () => {
      expect(
        isHardwareWallet(createMockKeyringWallet(KeyringTypes.ledger, {})),
      ).toBe(true);
      expect(
        isHardwareWallet(createMockKeyringWallet(KeyringTypes.trezor, {})),
      ).toBe(true);
      expect(
        isHardwareWallet(createMockKeyringWallet(KeyringTypes.oneKey, {})),
      ).toBe(true);
      expect(
        isHardwareWallet(createMockKeyringWallet(KeyringTypes.lattice, {})),
      ).toBe(true);
      expect(
        isHardwareWallet(
          createMockKeyringWallet(KeyringTypes.qr, {}),
        ),
      ).toBe(true);
    });

    it('returns false for non-hardware keyrings', () => {
      expect(
        isHardwareWallet(createMockKeyringWallet(KeyringTypes.simple, {})),
      ).toBe(false);
      expect(
        isHardwareWallet(createMockEntropyWallet('srp-1', 'Wallet 1', {})),
      ).toBe(false);
    });
  });

  describe('isImportedWallet', () => {
    it('returns true for simple key pair keyrings', () => {
      expect(
        isImportedWallet(createMockKeyringWallet(KeyringTypes.simple, {})),
      ).toBe(true);
    });

    it('returns false for hardware or entropy wallets', () => {
      expect(
        isImportedWallet(createMockKeyringWallet(KeyringTypes.ledger, {})),
      ).toBe(false);
      expect(
        isImportedWallet(createMockEntropyWallet('srp-1', 'Wallet 1', {})),
      ).toBe(false);
    });
  });

  describe('projectAccountManagementSections', () => {
    it('returns empty array when wallets object is empty', () => {
      expect(projectAccountManagementSections({ wallets: {} })).toEqual([]);
    });

    it('projects pinned accounts into virtual Pinned section while keeping them in their canonical section', () => {
      const wallets: AccountTreeWallets = {
        'entropy:srp-1': createMockEntropyWallet('srp-1', 'Main Wallet', {
          'g-1': { name: 'Account 1', pinned: true },
          'g-2': { name: 'Account 2', pinned: false },
        }),
      };

      const sections = projectAccountManagementSections({
        wallets,
        primaryEntropySourceId: 'srp-1',
      });

      expect(sections).toHaveLength(2);
      expect(sections[0].id).toBe('pinned');
      expect(sections[0].type).toBe('pinned');
      expect(sections[0].accounts).toHaveLength(1);
      expect(sections[0].accounts[0].groupId).toBe('entropy:srp-1/0');
      expect(sections[0].accounts[0].isPinned).toBe(true);

      expect(sections[1].id).toBe('wallet-entropy:srp-1');
      expect(sections[1].type).toBe('entropy-wallet');
      expect(sections[1].accounts).toHaveLength(1);
      expect(sections[1].accounts[0].groupId).toBe('entropy:srp-1/1');
      expect(sections[1].isRemovable).toBe(false);
      expect(sections[1].canAddAccount).toBe(true);
    });

    it('projects hardware accounts into Hardware section and imported into Imported section', () => {
      const wallets: AccountTreeWallets = {
        'entropy:srp-1': createMockEntropyWallet('srp-1', 'Main Wallet', {
          'g-1': { name: 'Account 1' },
        }),
        'keyring:Ledger Hardware': createMockKeyringWallet(KeyringTypes.ledger, {
          'g-hw-1': { name: 'Ledger 1' },
        }),
        'keyring:Simple Key Pair': createMockKeyringWallet(KeyringTypes.simple, {
          'g-imp-1': { name: 'Imported 1' },
        }),
      };

      const sections = projectAccountManagementSections({
        wallets,
        primaryEntropySourceId: 'srp-1',
      });

      expect(sections).toHaveLength(3);

      // Entropy wallet
      expect(sections[0].id).toBe('wallet-entropy:srp-1');
      expect(sections[0].type).toBe('entropy-wallet');

      // Hardware section
      expect(sections[1].id).toBe('hardware-wallets');
      expect(sections[1].type).toBe('hardware');
      expect(sections[1].accounts).toHaveLength(1);
      expect(sections[1].accounts[0].isHardware).toBe(true);

      // Imported section
      expect(sections[2].id).toBe('imported-accounts');
      expect(sections[2].type).toBe('imported');
      expect(sections[2].accounts).toHaveLength(1);
      expect(sections[2].accounts[0].isImported).toBe(true);
      expect(sections[2].accounts[0].isRemovable).toBe(true);
    });

    it('keeps hidden accounts in their canonical section with isHidden: true and excludes them from Pinned even if pinned: true', () => {
      const wallets: AccountTreeWallets = {
        'entropy:srp-1': createMockEntropyWallet('srp-1', 'Main Wallet', {
          'g-1': { name: 'Account 1', pinned: true, hidden: true },
          'g-2': { name: 'Account 2', hidden: true },
        }),
      };

      const sections = projectAccountManagementSections({
        wallets,
        primaryEntropySourceId: 'srp-1',
      });

      // No pinned section because the pinned account is hidden (hidden takes precedence)
      expect(sections).toHaveLength(1);
      expect(sections[0].id).toBe('wallet-entropy:srp-1');
      expect(sections[0].accounts).toHaveLength(2);
      expect(sections[0].accounts[0].isHidden).toBe(true);
      expect(sections[0].accounts[0].isPinned).toBe(false);
      expect(sections[0].accounts[1].isHidden).toBe(true);
    });

    it('identifies removable secondary entropy wallets and marks primary wallet as non-removable', () => {
      const wallets: AccountTreeWallets = {
        'entropy:srp-1': createMockEntropyWallet('srp-1', 'Primary Wallet', {
          'g-1': { name: 'Account 1' },
        }),
        'entropy:srp-2': createMockEntropyWallet('srp-2', 'Secondary Wallet', {
          'g-2': { name: 'Account 2' },
        }),
      };

      const sections = projectAccountManagementSections({
        wallets,
        primaryEntropySourceId: 'srp-1',
      });

      expect(sections).toHaveLength(2);
      expect(sections[0].isRemovable).toBe(false);
      expect(sections[1].isRemovable).toBe(true);
    });

    it('identifies locked wallets and disables add account / remove', () => {
      const wallets: AccountTreeWallets = {
        'entropy:srp-2': createMockEntropyWallet(
          'srp-2',
          'Locked Secondary Wallet',
          {
            'g-2': { name: 'Account 2' },
          },
          'uninitialized',
        ),
      };

      const sections = projectAccountManagementSections({
        wallets,
        primaryEntropySourceId: 'srp-1',
      });

      expect(sections).toHaveLength(1);
      expect(sections[0].isLocked).toBe(true);
      expect(sections[0].canAddAccount).toBe(false);
      expect(sections[0].isRemovable).toBe(false);
      expect(sections[0].accounts[0].isLocked).toBe(true);
    });
  });
});
