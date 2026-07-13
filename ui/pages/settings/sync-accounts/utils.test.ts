import { AccountWalletType, toAccountWalletId } from '@metamask/account-api';
import { KeyringTypes } from '@metamask/keyring-controller';

import type { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { filterSyncableWallets, isSyncableWallet } from './utils';

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
});
