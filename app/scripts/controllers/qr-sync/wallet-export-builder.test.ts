/**
 * @jest-environment node
 */
import {
  AccountGroupType,
  AccountWalletType,
  toAccountWalletId,
  type AccountGroupId,
} from '@metamask/account-api';
import type {
  AccountGroupObject,
  AccountWalletObject,
} from '@metamask/account-tree-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import { createMockInternalAccount } from '../../../../test/data/mock-accounts';

import { buildWalletExportEntries } from './wallet-export-builder';

const TEST_SEED_PHRASE_INDICES = new Uint8Array(
  new Uint16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).buffer,
);
const TEST_ENTROPY_ID = 'entropy-primary';
const TEST_ACCOUNT_ID = 'account-1';
const TEST_PRIVATE_KEY_ACCOUNT_ID = 'account-pk';

function createEntropyFixture(
  entropyId: string,
  groupIndex: number,
  groupSubId = groupIndex,
) {
  const walletId = toAccountWalletId(AccountWalletType.Entropy, entropyId);
  const groupId = `${walletId}/${groupSubId}` as AccountGroupId;
  const group = {
    type: AccountGroupType.MultichainAccount,
    id: groupId,
    accounts: [TEST_ACCOUNT_ID],
    metadata: {
      name: `Account ${groupIndex + 1}`,
      pinned: groupIndex === 1,
      hidden: false,
      lastSelected: 0,
      entropy: { groupIndex },
    },
  } as AccountGroupObject;
  const wallet = {
    type: AccountWalletType.Entropy,
    id: walletId,
    status: 'ready',
    groups: { [groupId]: group },
    metadata: {
      name: 'Wallet 1',
      entropy: { id: entropyId },
    },
  } as AccountWalletObject;

  return { walletId, groupId, group, wallet };
}

function createHdKeyringFixture(entropyId = TEST_ENTROPY_ID, groupIndex = 0) {
  const walletId = toAccountWalletId(AccountWalletType.Keyring, entropyId);
  const groupId = `${walletId}/account-${groupIndex}` as AccountGroupId;
  const group = {
    type: AccountGroupType.SingleAccount,
    id: groupId,
    accounts: [TEST_ACCOUNT_ID],
    metadata: {
      name: `Account ${groupIndex + 1}`,
      pinned: false,
      hidden: false,
      lastSelected: 0,
    },
  } as AccountGroupObject;
  const wallet = {
    type: AccountWalletType.Keyring,
    id: walletId,
    status: 'ready',
    groups: { [groupId]: group },
    metadata: {
      name: 'HD Wallet',
      keyring: { type: KeyringTypes.hd },
    },
  } as AccountWalletObject;
  const account = createMockInternalAccount({
    id: TEST_ACCOUNT_ID,
    options: {
      entropy: {
        type: 'mnemonic',
        id: entropyId,
        groupIndex,
      },
    },
  });

  return { walletId, groupId, group, wallet, account };
}

function createPrivateKeyFixture() {
  const walletId = toAccountWalletId(AccountWalletType.Keyring, 'imported');
  const groupId =
    `${walletId}/${TEST_PRIVATE_KEY_ACCOUNT_ID}` as AccountGroupId;
  const group = {
    type: AccountGroupType.SingleAccount,
    id: groupId,
    accounts: [TEST_PRIVATE_KEY_ACCOUNT_ID],
    metadata: {
      name: 'Imported Account',
      pinned: false,
      hidden: false,
      lastSelected: 0,
    },
  } as AccountGroupObject;
  const wallet = {
    type: AccountWalletType.Keyring,
    id: walletId,
    status: 'ready',
    groups: { [groupId]: group },
    metadata: {
      name: 'Imported',
      keyring: { type: KeyringTypes.simple },
    },
  } as AccountWalletObject;

  return { walletId, groupId, group, wallet };
}

describe('buildWalletExportEntries', () => {
  it('builds a mnemonic export with selected account group metadata', async () => {
    const fixture = createEntropyFixture(TEST_ENTROPY_ID, 0);

    const entries = await buildWalletExportEntries([fixture.groupId], {
      getAccountGroupObject: (groupId) =>
        groupId === fixture.groupId ? fixture.group : undefined,
      getAccountWalletObject: (walletId) =>
        walletId === fixture.walletId ? fixture.wallet : undefined,
      getAccount: () => undefined,
      getAccountAddress: () => '0x123',
      exportSeedPhrase: async () => TEST_SEED_PHRASE_INDICES,
      exportPrivateKey: async () => '0xabc',
      getPrimaryEntropyId: async () => TEST_ENTROPY_ID,
    });

    expect(entries).toEqual([
      expect.objectContaining({
        type: 'Mnemonic',
        name: 'Wallet 1',
        isPrimary: true,
        groups: [
          expect.objectContaining({
            groupIndex: 0,
            name: 'Account 1',
          }),
        ],
      }),
    ]);
  });

  it('includes only the selected groups for a mnemonic wallet', async () => {
    const group0 = createEntropyFixture(TEST_ENTROPY_ID, 0, 0);
    const group1 = createEntropyFixture(TEST_ENTROPY_ID, 1, 1);
    const wallet = {
      ...group0.wallet,
      groups: {
        [group0.groupId]: group0.group,
        [group1.groupId]: group1.group,
      },
    } as AccountWalletObject;
    const groupsById = new Map<AccountGroupId, AccountGroupObject>([
      [group0.groupId, group0.group],
      [group1.groupId, group1.group],
    ]);

    const entries = await buildWalletExportEntries([group1.groupId], {
      getAccountGroupObject: (groupId) => groupsById.get(groupId),
      getAccountWalletObject: () => wallet,
      getAccount: () => undefined,
      getAccountAddress: () => '0x123',
      exportSeedPhrase: async () => TEST_SEED_PHRASE_INDICES,
      exportPrivateKey: async () => '0xabc',
      getPrimaryEntropyId: async () => TEST_ENTROPY_ID,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      type: 'Mnemonic',
      groups: [
        expect.objectContaining({
          groupIndex: 1,
          name: 'Account 2',
          pinned: true,
        }),
      ],
    });
  });

  it('builds a private-key export entry', async () => {
    const fixture = createPrivateKeyFixture();

    const entries = await buildWalletExportEntries([fixture.groupId], {
      getAccountGroupObject: (groupId) =>
        groupId === fixture.groupId ? fixture.group : undefined,
      getAccountWalletObject: (walletId) =>
        walletId === fixture.walletId ? fixture.wallet : undefined,
      getAccount: () => undefined,
      getAccountAddress: (accountId) =>
        accountId === TEST_PRIVATE_KEY_ACCOUNT_ID ? '0ximported' : undefined,
      exportSeedPhrase: async () => TEST_SEED_PHRASE_INDICES,
      exportPrivateKey: async () => '0xprivate',
      getPrimaryEntropyId: async () => TEST_ENTROPY_ID,
    });

    expect(entries).toEqual([
      expect.objectContaining({
        type: 'PrivateKey',
        name: 'Imported Account',
        privateKey: 'MHhwcml2YXRl',
      }),
    ]);
  });

  it('builds a mnemonic export for HD keyring wallets', async () => {
    const fixture = createHdKeyringFixture(TEST_ENTROPY_ID, 2);

    const entries = await buildWalletExportEntries([fixture.groupId], {
      getAccountGroupObject: (groupId) =>
        groupId === fixture.groupId ? fixture.group : undefined,
      getAccountWalletObject: (walletId) =>
        walletId === fixture.walletId ? fixture.wallet : undefined,
      getAccount: (accountId) =>
        accountId === TEST_ACCOUNT_ID ? fixture.account : undefined,
      getAccountAddress: () => '0x123',
      exportSeedPhrase: async () => TEST_SEED_PHRASE_INDICES,
      exportPrivateKey: async () => '0xabc',
      getPrimaryEntropyId: async () => TEST_ENTROPY_ID,
    });

    expect(entries).toEqual([
      expect.objectContaining({
        type: 'Mnemonic',
        name: 'HD Wallet',
        isPrimary: true,
        groups: [
          expect.objectContaining({
            groupIndex: 2,
            name: 'Account 3',
          }),
        ],
      }),
    ]);
  });

  it('rejects non-exportable account groups', async () => {
    const fixture = createEntropyFixture(TEST_ENTROPY_ID, 0);
    const hardwareWallet = {
      type: AccountWalletType.Keyring,
      id: toAccountWalletId(AccountWalletType.Keyring, 'ledger'),
      status: 'ready',
      groups: {},
      metadata: {
        name: 'Ledger',
        keyring: { type: KeyringTypes.ledger },
      },
    } as AccountWalletObject;

    await expect(
      buildWalletExportEntries([fixture.groupId], {
        getAccountGroupObject: () => fixture.group,
        getAccountWalletObject: () => hardwareWallet,
        getAccount: () => undefined,
        getAccountAddress: () => '0x123',
        exportSeedPhrase: async () => TEST_SEED_PHRASE_INDICES,
        exportPrivateKey: async () => '0xabc',
        getPrimaryEntropyId: async () => TEST_ENTROPY_ID,
      }),
    ).rejects.toThrow(`Account group "${fixture.groupId}" cannot be synced.`);
  });
});
