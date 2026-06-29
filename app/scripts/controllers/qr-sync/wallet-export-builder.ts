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
import { KeyringTypes } from '@metamask/keyring-controller';

import type {
  AccountGroupExport,
  MnemonicWalletExport,
  PrivateKeyAccountExport,
  WalletExportEntry,
} from './types';
import {
  encodeMnemonicForWalletExport,
  encodePrivateKeyForWalletExport,
} from './wallet-export-encoding';

type MultichainAccountGroup = Extract<
  AccountGroupObject,
  { type: AccountGroupType.MultichainAccount }
>;

type SingleAccountGroup = Extract<
  AccountGroupObject,
  { type: AccountGroupType.SingleAccount }
>;

export type WalletExportBuilderDeps = {
  getAccountGroupObject: (
    groupId: AccountGroupId,
  ) => AccountGroupObject | undefined;
  getAccountWalletObject: (
    walletId: string,
  ) => AccountWalletObject | undefined;
  getAccountAddress: (accountId: AccountId) => string | undefined;
  exportSeedPhrase: (entropyId: EntropySourceId) => Promise<Uint8Array>;
  exportPrivateKey: (address: string) => Promise<string>;
  getPrimaryEntropyId: () => Promise<EntropySourceId | undefined>;
};

type EntropyExportBatch = {
  entropyId: EntropySourceId;
  walletName?: string;
  groups: MultichainAccountGroup[];
};

function toAccountGroupExport(group: MultichainAccountGroup): AccountGroupExport {
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

function toPrivateKeyMetadata(
  group: SingleAccountGroup,
): Pick<PrivateKeyAccountExport, 'name' | 'hidden' | 'pinned'> {
  const metadata: Pick<PrivateKeyAccountExport, 'name' | 'hidden' | 'pinned'> =
    {};

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

/**
 * Builds sync-ready wallet export entries from the user's account group selection.
 * @param selectedAccountGroupIds
 * @param deps
 */
// TODO: Replace this with data service class
export async function buildWalletExportEntries(
  selectedAccountGroupIds: AccountGroupId[],
  deps: WalletExportBuilderDeps,
): Promise<WalletExportEntry[]> {
  const uniqueGroupIds = [...new Set(selectedAccountGroupIds)];

  if (uniqueGroupIds.length === 0) {
    throw new Error('At least one account group must be selected.');
  }

  const entropyBatches = new Map<string, EntropyExportBatch>();
  const privateKeyGroups: SingleAccountGroup[] = [];

  for (const groupId of uniqueGroupIds) {
    const group = deps.getAccountGroupObject(groupId);
    if (!group) {
      throw new Error(`Account group "${groupId}" not found.`);
    }

    const {
      wallet: { id: walletId },
    } = parseAccountGroupId(groupId);
    const wallet = deps.getAccountWalletObject(walletId);
    if (!wallet) {
      throw new Error(`Wallet for account group "${groupId}" not found.`);
    }

    if (wallet.type === AccountWalletType.Entropy) {
      if (group.type !== AccountGroupType.MultichainAccount) {
        throw new Error(`Account group "${groupId}" cannot be synced.`);
      }

      const entropyId = wallet.metadata.entropy.id;
      const batch = entropyBatches.get(entropyId) ?? {
        entropyId,
        walletName: wallet.metadata.name,
        groups: [],
      };

      batch.groups.push(group);
      entropyBatches.set(entropyId, batch);
      continue;
    }

    if (
      wallet.type === AccountWalletType.Keyring &&
      wallet.metadata.keyring.type === KeyringTypes.simple &&
      group.type === AccountGroupType.SingleAccount
    ) {
      privateKeyGroups.push(group);
      continue;
    }

    throw new Error(`Account group "${groupId}" cannot be synced.`);
  }

  const primaryEntropyId = await deps.getPrimaryEntropyId();
  const mnemonicEntries: MnemonicWalletExport[] = [];

  for (const batch of entropyBatches.values()) {
    const seedPhrase = await deps.exportSeedPhrase(batch.entropyId);
    const groups = batch.groups
      .map(toAccountGroupExport)
      .sort((a, b) => a.groupIndex - b.groupIndex);

    mnemonicEntries.push({
      type: 'Mnemonic',
      mnemonic: encodeMnemonicForWalletExport(seedPhrase),
      groups,
      ...(batch.walletName ? { name: batch.walletName } : {}),
      ...(primaryEntropyId === batch.entropyId ? { isPrimary: true } : {}),
    });
  }

  const privateKeyEntries: PrivateKeyAccountExport[] = [];

  for (const group of privateKeyGroups) {
    const accountId = group.accounts[0];
    const address = deps.getAccountAddress(accountId);
    if (!address) {
      throw new Error(`Account for group "${group.id}" not found.`);
    }

    const privateKeyHex = await deps.exportPrivateKey(address);
    privateKeyEntries.push({
      type: 'PrivateKey',
      privateKey: encodePrivateKeyForWalletExport(privateKeyHex),
      ...toPrivateKeyMetadata(group),
    });
  }

  return [...mnemonicEntries, ...privateKeyEntries];
}
