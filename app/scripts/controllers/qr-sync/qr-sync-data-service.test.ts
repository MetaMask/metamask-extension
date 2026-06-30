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

      const entries = await dataService.buildWalletExportEntries(TEST_PASSWORD, [
        fixture.groupId,
      ]);

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

      const entries = await dataService.buildWalletExportEntries(TEST_PASSWORD, [
        group1.groupId,
      ]);

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

      const entries = await dataService.buildWalletExportEntries(TEST_PASSWORD, [
        fixture.groupId,
      ]);

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

      const entries = await dataService.buildWalletExportEntries(TEST_PASSWORD, [
        fixture.groupId,
      ]);

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

      const entries = await dataService.buildWalletExportEntries(TEST_PASSWORD, [
        fixture.groupId,
      ]);

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

      const entries = await dataService.buildWalletExportEntries(TEST_PASSWORD, [
        fixture.groupId,
      ]);

      expect(entries[0]).toMatchObject({
        type: 'PrivateKey',
        privateKey: 'MHhhYmNkZWY=',
      });
    });
  });
});
