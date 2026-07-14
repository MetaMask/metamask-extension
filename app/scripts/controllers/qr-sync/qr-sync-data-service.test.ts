/**
 * @jest-environment node
 */
import {
  AccountGroupType,
  AccountWalletType,
  toAccountWalletId,
  type AccountGroupId,
  type AccountWalletId,
} from '@metamask/account-api';
import type {
  AccountGroupObject,
  AccountWalletObject,
} from '@metamask/account-tree-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import { createMockInternalAccount } from '../../../../test/data/mock-accounts';

import { QrSyncDataService } from './qr-sync-data-service';
import type { QrSyncDataServiceMessenger } from './types';

type RootMessenger = Messenger<
  MockAnyNamespace,
  MessengerActions<QrSyncDataServiceMessenger>,
  MessengerEvents<QrSyncDataServiceMessenger>
>;

const TEST_PASSWORD = 'test-password';
const TEST_SEED_PHRASE_INDICES = new Uint8Array(
  new Uint16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).buffer,
);
const TEST_ENTROPY_ID = 'entropy-primary';
const TEST_SECONDARY_ENTROPY_ID = 'entropy-secondary';
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

function setupDataService(
  options: {
    groupsById?: Map<AccountGroupId, AccountGroupObject>;
    walletsById?: Map<AccountWalletId, AccountWalletObject>;
    getAccount?: (
      accountId: string,
    ) => ReturnType<typeof createMockInternalAccount> | undefined;
    exportSeedPhrase?: jest.Mock;
    exportPrivateKey?: jest.Mock;
    primaryEntropyId?: string;
  } = {},
) {
  const rootMessenger: RootMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });

  const dataServiceMessenger: QrSyncDataServiceMessenger = new Messenger({
    namespace: 'QrSyncDataService',
    parent: rootMessenger,
  });

  rootMessenger.delegate({
    messenger: dataServiceMessenger,
    actions: [
      'KeyringController:withKeyringV2',
      'KeyringController:exportSeedPhrase',
      'KeyringController:exportAccount',
      'AccountTreeController:getAccountGroupObject',
      'AccountTreeController:getAccountWalletObject',
      'AccountsController:getAccount',
    ],
  });

  const exportSeedPhrase =
    options.exportSeedPhrase ??
    jest.fn().mockResolvedValue(TEST_SEED_PHRASE_INDICES);
  const exportPrivateKey =
    options.exportPrivateKey ?? jest.fn().mockResolvedValue('0xprivate');
  const primaryEntropyId = options.primaryEntropyId ?? TEST_ENTROPY_ID;

  rootMessenger.registerActionHandler(
    'KeyringController:exportSeedPhrase',
    exportSeedPhrase,
  );
  rootMessenger.registerActionHandler(
    'KeyringController:exportAccount',
    exportPrivateKey,
  );
  rootMessenger.registerActionHandler(
    'KeyringController:withKeyringV2',
    jest.fn().mockImplementation((_selector, callback) =>
      callback({
        metadata: { id: primaryEntropyId },
      }),
    ),
  );
  rootMessenger.registerActionHandler(
    'AccountTreeController:getAccountGroupObject',
    jest.fn((groupId: AccountGroupId) => options.groupsById?.get(groupId)),
  );
  rootMessenger.registerActionHandler(
    'AccountTreeController:getAccountWalletObject',
    jest.fn((walletId: AccountWalletId) => options.walletsById?.get(walletId)),
  );
  rootMessenger.registerActionHandler(
    'AccountsController:getAccount',
    jest.fn((accountId: string) => options.getAccount?.(accountId)),
  );

  const dataService = new QrSyncDataService({
    messenger: dataServiceMessenger,
  });

  return {
    dataService,
    exportSeedPhrase,
    exportPrivateKey,
  };
}

describe('QrSyncDataService', () => {
  describe('buildWalletExportEntries', () => {
    it('builds a mnemonic export with selected account group metadata', async () => {
      const fixture = createEntropyFixture(TEST_ENTROPY_ID, 0);

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, fixture.group]]),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [fixture.groupId],
      );

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

      const { dataService } = setupDataService({
        groupsById,
        walletsById: new Map([[group0.walletId, wallet]]),
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [group1.groupId],
      );

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

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, fixture.group]]),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
        getAccount: (accountId) =>
          accountId === TEST_PRIVATE_KEY_ACCOUNT_ID
            ? createMockInternalAccount({
                id: TEST_PRIVATE_KEY_ACCOUNT_ID,
                address: '0ximported',
              })
            : undefined,
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [fixture.groupId],
      );

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

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, fixture.group]]),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
        getAccount: (accountId) =>
          accountId === TEST_ACCOUNT_ID ? fixture.account : undefined,
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [fixture.groupId],
      );

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

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, fixture.group]]),
        walletsById: new Map([[fixture.walletId, hardwareWallet]]),
      });

      await expect(
        dataService.buildWalletExportEntries(TEST_PASSWORD, [fixture.groupId]),
      ).rejects.toThrow(`Account group "${fixture.groupId}" cannot be synced.`);
    });

    it('base64-encodes the UTF-8 mnemonic string', async () => {
      const fixture = createEntropyFixture(TEST_ENTROPY_ID, 0);
      const mnemonicIndices = new Uint8Array(
        new Uint16Array([
          1788, 1788, 1788, 1788, 1788, 1788, 1788, 1788, 1788, 1788, 1788, 970,
        ]).buffer,
      );

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, fixture.group]]),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
        exportSeedPhrase: jest.fn().mockResolvedValue(mnemonicIndices),
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [fixture.groupId],
      );

      expect(entries[0]).toMatchObject({
        type: 'Mnemonic',
        mnemonic:
          'dGVzdCB0ZXN0IHRlc3QgdGVzdCB0ZXN0IHRlc3QgdGVzdCB0ZXN0IHRlc3QgdGVzdCB0ZXN0IGp1bms=',
      });
    });

    it('base64-encodes the UTF-8 hex private key string', async () => {
      const fixture = createPrivateKeyFixture();

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, fixture.group]]),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
        getAccount: (accountId) =>
          accountId === TEST_PRIVATE_KEY_ACCOUNT_ID
            ? createMockInternalAccount({
                id: TEST_PRIVATE_KEY_ACCOUNT_ID,
                address: '0ximported',
              })
            : undefined,
        exportPrivateKey: jest.fn().mockResolvedValue('0xabcdef'),
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [fixture.groupId],
      );

      expect(entries[0]).toMatchObject({
        type: 'PrivateKey',
        privateKey: 'MHhhYmNkZWY=',
      });
    });

    it('throws when no account groups are selected', async () => {
      const { dataService } = setupDataService();

      await expect(
        dataService.buildWalletExportEntries(TEST_PASSWORD, []),
      ).rejects.toThrow('At least one account group must be selected.');
    });

    it('deduplicates selected account group ids', async () => {
      const fixture = createEntropyFixture(TEST_ENTROPY_ID, 0);

      const { dataService, exportSeedPhrase } = setupDataService({
        groupsById: new Map([[fixture.groupId, fixture.group]]),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [fixture.groupId, fixture.groupId],
      );

      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        type: 'Mnemonic',
        groups: [expect.objectContaining({ groupIndex: 0 })],
      });
      expect(exportSeedPhrase).toHaveBeenCalledTimes(1);
    });

    it('combines multiple groups from the same entropy into one mnemonic entry', async () => {
      const group0 = createEntropyFixture(TEST_ENTROPY_ID, 0, 0);
      const group1 = createEntropyFixture(TEST_ENTROPY_ID, 1, 1);
      const wallet = {
        ...group0.wallet,
        groups: {
          [group0.groupId]: group0.group,
          [group1.groupId]: group1.group,
        },
      } as AccountWalletObject;

      const { dataService, exportSeedPhrase } = setupDataService({
        groupsById: new Map([
          [group0.groupId, group0.group],
          [group1.groupId, group1.group],
        ]),
        walletsById: new Map([[group0.walletId, wallet]]),
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [group0.groupId, group1.groupId],
      );

      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        type: 'Mnemonic',
        groups: [
          expect.objectContaining({ groupIndex: 0, name: 'Account 1' }),
          expect.objectContaining({
            groupIndex: 1,
            name: 'Account 2',
            pinned: true,
          }),
        ],
      });
      expect(exportSeedPhrase).toHaveBeenCalledTimes(1);
      expect(exportSeedPhrase).toHaveBeenCalledWith(
        { password: TEST_PASSWORD },
        TEST_ENTROPY_ID,
      );
    });

    it('sorts mnemonic groups by groupIndex', async () => {
      const group0 = createEntropyFixture(TEST_ENTROPY_ID, 0, 0);
      const group2 = createEntropyFixture(TEST_ENTROPY_ID, 2, 2);
      const wallet = {
        ...group0.wallet,
        groups: {
          [group0.groupId]: group0.group,
          [group2.groupId]: group2.group,
        },
      } as AccountWalletObject;

      const { dataService } = setupDataService({
        groupsById: new Map([
          [group0.groupId, group0.group],
          [group2.groupId, group2.group],
        ]),
        walletsById: new Map([[group0.walletId, wallet]]),
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [group2.groupId, group0.groupId],
      );

      const mnemonicEntry = entries[0] as { groups: { groupIndex: number }[] };
      expect(mnemonicEntry.groups.map((group) => group.groupIndex)).toEqual([
        0, 2,
      ]);
    });

    it('marks only the primary entropy wallet with isPrimary', async () => {
      const primary = createEntropyFixture(TEST_ENTROPY_ID, 0);
      const secondary = createEntropyFixture(TEST_SECONDARY_ENTROPY_ID, 0);

      const { dataService } = setupDataService({
        groupsById: new Map([
          [primary.groupId, primary.group],
          [secondary.groupId, secondary.group],
        ]),
        walletsById: new Map([
          [primary.walletId, primary.wallet],
          [secondary.walletId, secondary.wallet],
        ]),
        primaryEntropyId: TEST_ENTROPY_ID,
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [primary.groupId, secondary.groupId],
      );

      expect(entries).toHaveLength(2);
      expect(entries[0]).toMatchObject({
        type: 'Mnemonic',
        isPrimary: true,
      });
      expect(entries[1]).toMatchObject({
        type: 'Mnemonic',
      });
      expect(entries[1]).not.toHaveProperty('isPrimary');
    });

    it('builds mixed mnemonic and private key exports', async () => {
      const mnemonicFixture = createEntropyFixture(TEST_ENTROPY_ID, 0);
      const privateKeyFixture = createPrivateKeyFixture();

      const { dataService } = setupDataService({
        groupsById: new Map([
          [mnemonicFixture.groupId, mnemonicFixture.group],
          [privateKeyFixture.groupId, privateKeyFixture.group],
        ]),
        walletsById: new Map([
          [mnemonicFixture.walletId, mnemonicFixture.wallet],
          [privateKeyFixture.walletId, privateKeyFixture.wallet],
        ]),
        getAccount: (accountId) =>
          accountId === TEST_PRIVATE_KEY_ACCOUNT_ID
            ? createMockInternalAccount({
                id: TEST_PRIVATE_KEY_ACCOUNT_ID,
                address: '0ximported',
              })
            : undefined,
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [mnemonicFixture.groupId, privateKeyFixture.groupId],
      );

      expect(entries).toHaveLength(2);
      expect(entries[0]).toMatchObject({ type: 'Mnemonic' });
      expect(entries[1]).toMatchObject({
        type: 'PrivateKey',
        name: 'Imported Account',
      });
    });

    it('throws when account group is not found', async () => {
      const fixture = createEntropyFixture(TEST_ENTROPY_ID, 0);

      const { dataService } = setupDataService({
        groupsById: new Map(),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
      });

      await expect(
        dataService.buildWalletExportEntries(TEST_PASSWORD, [fixture.groupId]),
      ).rejects.toThrow(`Account group "${fixture.groupId}" not found.`);
    });

    it('throws when wallet is not found', async () => {
      const fixture = createEntropyFixture(TEST_ENTROPY_ID, 0);

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, fixture.group]]),
        walletsById: new Map(),
      });

      await expect(
        dataService.buildWalletExportEntries(TEST_PASSWORD, [fixture.groupId]),
      ).rejects.toThrow(
        `Wallet for account group "${fixture.groupId}" not found.`,
      );
    });

    it('throws when entropy wallet group is not a multichain account', async () => {
      const fixture = createEntropyFixture(TEST_ENTROPY_ID, 0);
      const invalidGroup = {
        ...fixture.group,
        type: AccountGroupType.SingleAccount,
      } as AccountGroupObject;

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, invalidGroup]]),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
      });

      await expect(
        dataService.buildWalletExportEntries(TEST_PASSWORD, [fixture.groupId]),
      ).rejects.toThrow(`Account group "${fixture.groupId}" cannot be synced.`);
    });

    it('rejects snap wallets', async () => {
      const snapWalletId = toAccountWalletId(AccountWalletType.Snap, 'snap1');
      const groupId = `${snapWalletId}/0` as AccountGroupId;
      const group = {
        type: AccountGroupType.MultichainAccount,
        id: groupId,
        accounts: [TEST_ACCOUNT_ID],
        metadata: {
          name: 'Snap Account',
          pinned: false,
          hidden: false,
          lastSelected: 0,
          entropy: { groupIndex: 0 },
        },
      } as AccountGroupObject;
      const snapWallet = {
        type: AccountWalletType.Snap,
        id: snapWalletId,
        status: 'ready',
        groups: { [groupId]: group },
        metadata: { name: 'Snap Wallet', snap: { id: 'npm:example' } },
      } as AccountWalletObject;

      const { dataService } = setupDataService({
        groupsById: new Map([[groupId, group]]),
        walletsById: new Map([[snapWalletId, snapWallet]]),
      });

      await expect(
        dataService.buildWalletExportEntries(TEST_PASSWORD, [groupId]),
      ).rejects.toThrow(`Account group "${groupId}" cannot be synced.`);
    });

    it('resolves entropy id from entropySource account option for HD keyring wallets', async () => {
      const fixture = createHdKeyringFixture(TEST_ENTROPY_ID, 1);
      const account = createMockInternalAccount({
        id: TEST_ACCOUNT_ID,
        options: {
          entropySource: TEST_ENTROPY_ID,
        },
      });

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, fixture.group]]),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
        getAccount: (accountId) =>
          accountId === TEST_ACCOUNT_ID ? account : undefined,
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [fixture.groupId],
      );

      expect(entries[0]).toMatchObject({
        type: 'Mnemonic',
        groups: [expect.objectContaining({ groupIndex: 0 })],
      });
    });

    it('includes hidden metadata when group or account is hidden', async () => {
      const fixture = createEntropyFixture(TEST_ENTROPY_ID, 0);
      const hiddenGroup = {
        ...fixture.group,
        metadata: {
          ...fixture.group.metadata,
          hidden: true,
        },
      } as AccountGroupObject;

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, hiddenGroup]]),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
      });

      const entries = await dataService.buildWalletExportEntries(
        TEST_PASSWORD,
        [fixture.groupId],
      );

      expect(entries[0]).toMatchObject({
        type: 'Mnemonic',
        groups: [expect.objectContaining({ hidden: true })],
      });
      expect(
        (entries[0] as { groups: { pinned?: boolean }[] }).groups[0],
      ).not.toHaveProperty('pinned');
    });

    it('throws when private key account address cannot be resolved', async () => {
      const fixture = createPrivateKeyFixture();

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, fixture.group]]),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
        getAccount: () => undefined,
      });

      await expect(
        dataService.buildWalletExportEntries(TEST_PASSWORD, [fixture.groupId]),
      ).rejects.toThrow(`Account for group "${fixture.groupId}" not found.`);
    });

    it('throws when HD keyring account has no entropy id', async () => {
      const fixture = createHdKeyringFixture(TEST_ENTROPY_ID, 0);
      const account = createMockInternalAccount({
        id: TEST_ACCOUNT_ID,
        options: {},
      });

      const { dataService } = setupDataService({
        groupsById: new Map([[fixture.groupId, fixture.group]]),
        walletsById: new Map([[fixture.walletId, fixture.wallet]]),
        getAccount: (accountId) =>
          accountId === TEST_ACCOUNT_ID ? account : undefined,
      });

      await expect(
        dataService.buildWalletExportEntries(TEST_PASSWORD, [fixture.groupId]),
      ).rejects.toThrow(`Account group "${fixture.groupId}" cannot be synced.`);
    });

    it('calls exportSeedPhrase once per unique entropy id', async () => {
      const primary = createEntropyFixture(TEST_ENTROPY_ID, 0);
      const secondary = createEntropyFixture(TEST_SECONDARY_ENTROPY_ID, 0);

      const { dataService, exportSeedPhrase } = setupDataService({
        groupsById: new Map([
          [primary.groupId, primary.group],
          [secondary.groupId, secondary.group],
        ]),
        walletsById: new Map([
          [primary.walletId, primary.wallet],
          [secondary.walletId, secondary.wallet],
        ]),
      });

      await dataService.buildWalletExportEntries(TEST_PASSWORD, [
        primary.groupId,
        secondary.groupId,
      ]);

      expect(exportSeedPhrase).toHaveBeenCalledTimes(2);
      expect(exportSeedPhrase).toHaveBeenCalledWith(
        { password: TEST_PASSWORD },
        TEST_ENTROPY_ID,
      );
      expect(exportSeedPhrase).toHaveBeenCalledWith(
        { password: TEST_PASSWORD },
        TEST_SECONDARY_ENTROPY_ID,
      );
    });
  });
});
