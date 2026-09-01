import {
  AccountGroupType,
  AccountWalletType,
  parseAccountGroupId,
  type AccountGroupId,
} from '@metamask/account-api';
import type {
  AccountGroupObject,
  AccountWalletObject,
} from '@metamask/account-tree-controller';
import type { AccountId } from '@metamask/accounts-controller';
import type { EntropySourceId } from '@metamask/keyring-api';
import { KeyringType } from '@metamask/keyring-api/v2';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { bytesToBase64, stringToBytes } from '@metamask/utils';

import { createSentryError } from '../../../../shared/lib/error';
import { convertEnglishWordlistIndicesToCodepoints } from '../../lib/util';
import {
  type QrSyncDataServiceMessenger,
  AccountGroupExport,
  MnemonicWalletExport,
  PrivateKeyAccountExport,
  WalletExportEntry,
} from './types';
import { QR_SYNC_DATA_SERVICE_NAME } from './constants';

type MultichainAccountGroup = Extract<
  AccountGroupObject,
  { type: AccountGroupType.MultichainAccount }
>;

type SingleAccountGroup = Extract<
  AccountGroupObject,
  { type: AccountGroupType.SingleAccount }
>;

type EntropyWallet = Extract<
  AccountWalletObject,
  { type: AccountWalletType.Entropy }
>;

type KeyringWallet = Extract<
  AccountWalletObject,
  { type: AccountWalletType.Keyring }
>;

type WalletExportContext = {
  password: string;
  primaryEntropyId: EntropySourceId | undefined;
  mnemonicEntriesByEntropyId: Map<EntropySourceId, MnemonicWalletExport>;
  mnemonicEntropyOrder: EntropySourceId[];
  privateKeyEntries: PrivateKeyAccountExport[];
};

const MESSENGER_EXPOSED_METHODS = ['buildWalletExportEntries'] as const;

/**
 * Data service for building QR sync wallet export payloads.
 */
export class QrSyncDataService {
  readonly name: typeof QR_SYNC_DATA_SERVICE_NAME = QR_SYNC_DATA_SERVICE_NAME;

  readonly #messenger: QrSyncDataServiceMessenger;

  constructor({ messenger }: { messenger: QrSyncDataServiceMessenger }) {
    this.#messenger = messenger;

    this.#messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }

  /**
   * Builds sync-ready wallet export entries from the user's account group selection.
   *
   * @param password - The wallet password used to export secrets.
   * @param selectedAccountGroupIds - The account groups selected for sync.
   * @returns Wallet export entries for the sync-ready payload.
   */
  async buildWalletExportEntries(
    password: string,
    selectedAccountGroupIds: AccountGroupId[],
  ): Promise<WalletExportEntry[]> {
    try {
      const uniqueGroupIds = [...new Set(selectedAccountGroupIds)];

      if (uniqueGroupIds.length === 0) {
        throw new Error('At least one account group must be selected.');
      }

      const primaryEntropyId = await this.#getPrimaryEntropyId();
      const mnemonicEntriesByEntropyId = new Map<
        EntropySourceId,
        MnemonicWalletExport
      >();
      const mnemonicEntropyOrder: EntropySourceId[] = [];
      const privateKeyEntries: PrivateKeyAccountExport[] = [];

      for (const groupId of uniqueGroupIds) {
        const { group, wallet } = this.#getAccountGroupAndWalletObject(groupId);
        const context: WalletExportContext = {
          password,
          primaryEntropyId,
          mnemonicEntriesByEntropyId,
          mnemonicEntropyOrder,
          privateKeyEntries,
        };

        if (wallet.type === AccountWalletType.Entropy) {
          await this.#appendEntropyWallet(groupId, group, wallet, context);
          continue;
        }

        if (wallet.type === AccountWalletType.Keyring) {
          await this.#appendKeyringWallet(groupId, group, wallet, context);
          continue;
        }

        throw new Error(`Account group "${groupId}" cannot be synced.`);
      }

      const mnemonicEntries = mnemonicEntropyOrder.map((entropyId) => {
        const entry = mnemonicEntriesByEntropyId.get(entropyId);
        if (!entry) {
          throw new Error(`Mnemonic export for "${entropyId}" not found.`);
        }

        return {
          ...entry,
          groups: [...entry.groups].sort((a, b) => a.groupIndex - b.groupIndex),
        };
      });

      return [...mnemonicEntries, ...privateKeyEntries];
    } catch (error) {
      this.#messenger.captureException?.(
        createSentryError(
          'Failed to build QR sync wallet export entries',
          error,
        ),
      );
      throw error;
    }
  }

  #getAccountGroupAndWalletObject(groupId: AccountGroupId): {
    group: AccountGroupObject;
    wallet: AccountWalletObject;
  } {
    const group = this.#messenger.call(
      'AccountTreeController:getAccountGroupObject',
      groupId,
    );
    if (!group) {
      throw new Error(`Account group "${groupId}" not found.`);
    }

    const {
      wallet: { id: walletId },
    } = parseAccountGroupId(groupId);
    const wallet = this.#messenger.call(
      'AccountTreeController:getAccountWalletObject',
      walletId,
    );
    if (!wallet) {
      throw new Error(`Wallet for account group "${groupId}" not found.`);
    }

    return { group, wallet };
  }

  async #appendEntropyWallet(
    groupId: AccountGroupId,
    group: AccountGroupObject,
    wallet: EntropyWallet,
    context: WalletExportContext,
  ): Promise<void> {
    if (group.type !== AccountGroupType.MultichainAccount) {
      throw new Error(`Account group "${groupId}" cannot be synced.`);
    }

    await this.#appendMnemonicGroup({
      password: context.password,
      entropyId: wallet.metadata.entropy.id,
      walletName: wallet.metadata.name,
      groupExport: this.#toAccountGroupExport(group),
      primaryEntropyId: context.primaryEntropyId,
      mnemonicEntriesByEntropyId: context.mnemonicEntriesByEntropyId,
      mnemonicEntropyOrder: context.mnemonicEntropyOrder,
    });
  }

  async #appendKeyringWallet(
    groupId: AccountGroupId,
    group: AccountGroupObject,
    wallet: KeyringWallet,
    context: WalletExportContext,
  ): Promise<void> {
    const keyringType = wallet.metadata.keyring.type;

    if (
      keyringType === KeyringTypes.simple &&
      group.type === AccountGroupType.SingleAccount
    ) {
      const accountId = group.accounts[0];
      const address = this.#getAccountAddress(accountId);
      if (!address) {
        throw new Error(`Account for group "${group.id}" not found.`);
      }

      const privateKeyHex = await this.#messenger.call(
        'KeyringController:exportAccount',
        { password: context.password },
        address,
      );
      context.privateKeyEntries.push({
        type: 'PrivateKey',
        privateKey: this.#encodePrivateKeyForWalletExport(privateKeyHex),
        ...this.#toPrivateKeyMetadata(group),
      });
      return;
    }

    if (
      keyringType === KeyringTypes.hd &&
      group.type === AccountGroupType.SingleAccount
    ) {
      const account = this.#messenger.call(
        'AccountsController:getAccount',
        group.accounts[0],
      );
      if (!account) {
        throw new Error(`Account for group "${group.id}" not found.`);
      }

      const entropyId = this.#resolveEntropyIdFromAccount(account);
      if (!entropyId) {
        throw new Error(`Account group "${groupId}" cannot be synced.`);
      }

      await this.#appendMnemonicGroup({
        password: context.password,
        entropyId,
        walletName: wallet.metadata.name,
        groupExport: this.#toAccountGroupExportFromSingleAccount(
          group,
          this.#resolveGroupIndexFromAccount(account),
        ),
        primaryEntropyId: context.primaryEntropyId,
        mnemonicEntriesByEntropyId: context.mnemonicEntriesByEntropyId,
        mnemonicEntropyOrder: context.mnemonicEntropyOrder,
      });
      return;
    }

    throw new Error(`Account group "${groupId}" cannot be synced.`);
  }

  async #appendMnemonicGroup({
    password,
    entropyId,
    walletName,
    groupExport,
    primaryEntropyId,
    mnemonicEntriesByEntropyId,
    mnemonicEntropyOrder,
  }: {
    password: string;
    entropyId: EntropySourceId;
    walletName?: string;
    groupExport: AccountGroupExport;
    primaryEntropyId: EntropySourceId | undefined;
    mnemonicEntriesByEntropyId: Map<EntropySourceId, MnemonicWalletExport>;
    mnemonicEntropyOrder: EntropySourceId[];
  }): Promise<void> {
    let mnemonicEntry = mnemonicEntriesByEntropyId.get(entropyId);

    if (!mnemonicEntry) {
      const seedPhrase = await this.#messenger.call(
        'KeyringController:exportSeedPhrase',
        { password },
        entropyId,
      );

      mnemonicEntry = {
        type: 'Mnemonic',
        mnemonic: this.#encodeMnemonicForWalletExport(seedPhrase),
        groups: [],
        ...(walletName ? { name: walletName } : {}),
        ...(primaryEntropyId === entropyId ? { isPrimary: true } : {}),
      };
      mnemonicEntriesByEntropyId.set(entropyId, mnemonicEntry);
      mnemonicEntropyOrder.push(entropyId);
    } else if (walletName && !mnemonicEntry.name) {
      mnemonicEntry.name = walletName;
    }

    mnemonicEntry.groups.push(groupExport);
  }

  async #getPrimaryEntropyId(): Promise<EntropySourceId | undefined> {
    return (await this.#messenger.call(
      'KeyringController:withKeyringV2',
      { type: KeyringType.Hd, index: 0 },
      async ({ metadata }: { metadata: { id: EntropySourceId } }) =>
        metadata.id,
    )) as EntropySourceId | undefined;
  }

  #getAccountAddress(accountId: AccountId): string | undefined {
    return this.#messenger.call('AccountsController:getAccount', accountId)
      ?.address;
  }

  #toAccountGroupExport(group: MultichainAccountGroup): AccountGroupExport {
    const exportGroup: AccountGroupExport = {
      groupIndex: group.metadata.entropy.groupIndex,
    };

    if (group.metadata.name) {
      exportGroup.name = group.metadata.name;
    }
    if (group.metadata.hidden) {
      exportGroup.hidden = true;
    }
    if (group.metadata.pinned) {
      exportGroup.pinned = true;
    }

    return exportGroup;
  }

  #toAccountGroupExportFromSingleAccount(
    group: SingleAccountGroup,
    groupIndex: number,
  ): AccountGroupExport {
    const exportGroup: AccountGroupExport = { groupIndex };

    if (group.metadata.name) {
      exportGroup.name = group.metadata.name;
    }
    if (group.metadata.hidden) {
      exportGroup.hidden = true;
    }
    if (group.metadata.pinned) {
      exportGroup.pinned = true;
    }

    return exportGroup;
  }

  #toPrivateKeyMetadata(
    group: SingleAccountGroup,
  ): Pick<PrivateKeyAccountExport, 'name' | 'hidden' | 'pinned'> {
    const metadata: Pick<
      PrivateKeyAccountExport,
      'name' | 'hidden' | 'pinned'
    > = {};

    if (group.metadata.name) {
      metadata.name = group.metadata.name;
    }
    if (group.metadata.hidden) {
      metadata.hidden = true;
    }
    if (group.metadata.pinned) {
      metadata.pinned = true;
    }

    return metadata;
  }

  #resolveEntropyIdFromAccount(
    account: InternalAccount,
  ): EntropySourceId | undefined {
    const entropy = account.options?.entropy;

    if (
      entropy &&
      typeof entropy === 'object' &&
      entropy.type === 'mnemonic' &&
      'id' in entropy &&
      typeof entropy.id === 'string'
    ) {
      return entropy.id;
    }

    const entropySource = account.options?.entropySource;
    if (typeof entropySource === 'string') {
      return entropySource;
    }

    return undefined;
  }

  #resolveGroupIndexFromAccount(account: InternalAccount): number {
    const entropy = account.options?.entropy;

    if (
      entropy &&
      typeof entropy === 'object' &&
      entropy.type === 'mnemonic' &&
      'groupIndex' in entropy &&
      typeof entropy.groupIndex === 'number'
    ) {
      return entropy.groupIndex;
    }

    return 0;
  }

  /**
   * Encodes a BIP-39 mnemonic for the sync-ready payload.
   *
   * Flow: wordlist indices → UTF-8 space-separated words → base64.
   * @param wordlistIndices
   */
  #encodeMnemonicForWalletExport(wordlistIndices: Uint8Array): string {
    const mnemonicUtf8 =
      convertEnglishWordlistIndicesToCodepoints(wordlistIndices);
    return bytesToBase64(mnemonicUtf8);
  }

  /**
   * Encodes a hex private key string for the sync-ready payload.
   *
   * Flow: UTF-8 string (e.g. `0xabc…`) → base64.
   * @param privateKeyHex
   */
  #encodePrivateKeyForWalletExport(privateKeyHex: string): string {
    return bytesToBase64(stringToBytes(privateKeyHex));
  }
}
