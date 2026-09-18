import { AccountWalletType, toAccountWalletId } from '@metamask/account-api';
import { KeyringTypes } from '@metamask/keyring-controller';

import type { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import {
  filterSyncableWallets,
  getSyncSummaryCounts,
  isSyncableWallet,
} from './utils';

const entropyWalletId = toAccountWalletId(
  AccountWalletType.Entropy,
  'entropy1',
);
const importedWalletId = toAccountWalletId(
  AccountWalletType.Keyring,
  'imported',
);
const hdKeyringWalletId = toAccountWalletId(
  AccountWalletType.Keyring,
  'hd-wallet',
);
const ledgerWalletId = toAccountWalletId(AccountWalletType.Keyring, 'ledger');
const snapWalletId = toAccountWalletId(AccountWalletType.Snap, 'snap1');

const mockWallets = {
  [entropyWalletId]: {
    id: entropyWalletId,
    type: AccountWalletType.Entropy,
    metadata: { name: 'SRP Wallet', entropy: { id: 'entropy1' } },
    groups: {},
  },
  [importedWalletId]: {
    id: importedWalletId,
    type: AccountWalletType.Keyring,
    metadata: {
      name: 'Imported',
      keyring: { type: KeyringTypes.simple },
    },
    groups: {},
  },
  [hdKeyringWalletId]: {
    id: hdKeyringWalletId,
    type: AccountWalletType.Keyring,
    metadata: {
      name: 'HD Keyring',
      keyring: { type: KeyringTypes.hd },
    },
    groups: {},
  },
  [ledgerWalletId]: {
    id: ledgerWalletId,
    type: AccountWalletType.Keyring,
    metadata: {
      name: 'Ledger',
      keyring: { type: KeyringTypes.ledger },
    },
    groups: {},
  },
  [snapWalletId]: {
    id: snapWalletId,
    type: AccountWalletType.Snap,
    metadata: { name: 'Snap', snap: { id: 'npm:example' } },
    groups: {},
  },
} as unknown as AccountTreeWallets;

describe('add-device-tab utils', () => {
  describe('isSyncableWallet', () => {
    it('returns true for entropy wallets', () => {
      expect(isSyncableWallet(mockWallets[entropyWalletId])).toBe(true);
    });

    it('returns true for imported private-key wallets', () => {
      expect(isSyncableWallet(mockWallets[importedWalletId])).toBe(true);
    });

    it('returns true for HD keyring wallets', () => {
      expect(isSyncableWallet(mockWallets[hdKeyringWalletId])).toBe(true);
    });

    it('returns false for hardware wallets', () => {
      expect(isSyncableWallet(mockWallets[ledgerWalletId])).toBe(false);
    });

    it('returns false for snap wallets', () => {
      expect(isSyncableWallet(mockWallets[snapWalletId])).toBe(false);
    });
  });

  describe('filterSyncableWallets', () => {
    it('keeps only entropy, HD keyring, and imported private-key wallets', () => {
      expect(filterSyncableWallets(mockWallets)).toEqual({
        [entropyWalletId]: mockWallets[entropyWalletId],
        [importedWalletId]: mockWallets[importedWalletId],
        [hdKeyringWalletId]: mockWallets[hdKeyringWalletId],
      });
    });
  });

  describe('getSyncSummaryCounts', () => {
    const entropyGroupId = `${entropyWalletId}/0` as const;
    const importedGroupId = `${importedWalletId}/0` as const;
    const hdKeyringGroupId = `${hdKeyringWalletId}/0` as const;

    const walletsWithGroups = {
      [entropyWalletId]: {
        ...mockWallets[entropyWalletId],
        groups: {
          [entropyGroupId]: {
            id: entropyGroupId,
            metadata: { name: 'Account 1' },
          },
        },
      },
      [importedWalletId]: {
        ...mockWallets[importedWalletId],
        groups: {
          [importedGroupId]: {
            id: importedGroupId,
            metadata: { name: 'Imported Account 1' },
          },
        },
      },
      [hdKeyringWalletId]: {
        ...mockWallets[hdKeyringWalletId],
        groups: {
          [hdKeyringGroupId]: {
            id: hdKeyringGroupId,
            metadata: { name: 'HD Account 1' },
          },
        },
      },
    } as unknown as AccountTreeWallets;

    it('counts entropy wallets and imported account groups separately', () => {
      expect(
        getSyncSummaryCounts(walletsWithGroups, [
          entropyGroupId,
          importedGroupId,
        ]),
      ).toEqual({
        syncedWalletCount: 1,
        syncedAccountCount: 1,
      });
    });

    it('counts HD keyring wallets as wallets', () => {
      expect(
        getSyncSummaryCounts(walletsWithGroups, [hdKeyringGroupId]),
      ).toEqual({
        syncedWalletCount: 1,
        syncedAccountCount: 0,
      });
    });

    it('counts multiple entropy wallets and one imported account', () => {
      const secondEntropyWalletId = toAccountWalletId(
        AccountWalletType.Entropy,
        'entropy2',
      );
      const secondEntropyGroupId = `${secondEntropyWalletId}/0` as const;

      const multiWalletState = {
        ...walletsWithGroups,
        [secondEntropyWalletId]: {
          id: secondEntropyWalletId,
          type: AccountWalletType.Entropy,
          metadata: { name: 'Wallet 2', entropy: { id: 'entropy2' } },
          groups: {
            [secondEntropyGroupId]: {
              id: secondEntropyGroupId,
              metadata: { name: 'Account 1' },
            },
          },
        },
      } as unknown as AccountTreeWallets;

      expect(
        getSyncSummaryCounts(multiWalletState, [
          entropyGroupId,
          secondEntropyGroupId,
          importedGroupId,
        ]),
      ).toEqual({
        syncedWalletCount: 2,
        syncedAccountCount: 1,
      });
    });
  });
});
