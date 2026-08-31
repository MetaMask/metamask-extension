import {
  AccountGroupId,
  AccountWalletId,
  AccountWalletType,
  isAccountWalletId,
  stripAccountWalletType,
} from '@metamask/account-api';
import type {
  AccountGroupObject,
  AccountWalletObject,
} from '@metamask/account-tree-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';

export const HARDWARE_KEYRING_TYPES = new Set<string>([
  KeyringTypes.ledger,
  KeyringTypes.trezor,
  KeyringTypes.oneKey,
  KeyringTypes.lattice,
  KeyringTypes.qr,
  'Ledger Hardware',
  'Trezor Hardware',
  'OneKey Hardware',
  'Lattice Hardware',
  'QR Hardware Wallet Device',
  'ledger',
  'trezor',
  'oneKey',
  'lattice',
  'qr',
]);

function getKeyringType(wallet: AccountWalletObject): string | undefined {
  if (
    wallet.type === AccountWalletType.Keyring &&
    typeof wallet.metadata === 'object' &&
    wallet.metadata !== null &&
    'keyring' in wallet.metadata &&
    typeof wallet.metadata.keyring === 'object' &&
    wallet.metadata.keyring !== null &&
    'type' in wallet.metadata.keyring &&
    typeof wallet.metadata.keyring.type === 'string'
  ) {
    return wallet.metadata.keyring.type;
  }
  return undefined;
}

function extractRawEntropyId(id: string): string {
  if (isAccountWalletId(id)) {
    return stripAccountWalletType(id);
  }
  return id;
}

export function isHardwareWallet(wallet: AccountWalletObject): boolean {
  const keyringType = getKeyringType(wallet);
  return Boolean(keyringType && HARDWARE_KEYRING_TYPES.has(keyringType));
}

export function isImportedWallet(wallet: AccountWalletObject): boolean {
  const keyringType = getKeyringType(wallet);
  return (
    keyringType === KeyringTypes.simple ||
    keyringType === 'Simple Key Pair'
  );
}

export type AccountManagementRowItem = {
  id: string;
  groupId: AccountGroupId;
  groupData: AccountGroupObject;
  walletId: AccountWalletId;
  walletName?: string;
  isPinned: boolean;
  isHidden: boolean;
  isLocked: boolean;
  isHardware: boolean;
  isImported: boolean;
  isRemovable: boolean;
};

export type AccountManagementSectionType =
  | 'pinned'
  | 'entropy-wallet'
  | 'hardware'
  | 'imported'
  | 'snap'
  | 'other';

export type AccountManagementSection = {
  id: string;
  title: string;
  titleKey?: string;
  type: AccountManagementSectionType;
  walletId?: AccountWalletId;
  isCollapsible?: boolean;
  isLocked?: boolean;
  isRemovable?: boolean;
  canAddAccount?: boolean;
  accounts: AccountManagementRowItem[];
};

export type ProjectAccountManagementSectionsOptions = {
  wallets: AccountTreeWallets;
  primaryEntropySourceId?: string;
};

/**
 * Projects the raw AccountTreeWallets into ordered sections for Account Management:
 * 1. Pinned section (virtual, always first if pinned accounts exist)
 * 2. Entropy wallet sections (each entropy wallet in its canonical order)
 * 3. Hardware wallets section (aggregated hardware accounts)
 * 4. Imported accounts section (aggregated private-key imported accounts)
 * 5. Other/Snap wallet sections (if any)
 *
 * Hidden accounts remain in their canonical source sections with isHidden: true.
 * Hidden state takes precedence over pinned state.
 * Empty sections are excluded.
 * @param options0
 * @param options0.wallets
 * @param options0.primaryEntropySourceId
 */
export function projectAccountManagementSections({
  wallets,
  primaryEntropySourceId,
}: ProjectAccountManagementSectionsOptions): AccountManagementSection[] {
  if (!wallets || Object.keys(wallets).length === 0) {
    return [];
  }

  const pinnedAccounts: AccountManagementRowItem[] = [];
  const hardwareAccounts: AccountManagementRowItem[] = [];
  const importedAccounts: AccountManagementRowItem[] = [];
  const otherWalletSections: AccountManagementSection[] = [];
  const entropyWalletSections: AccountManagementSection[] = [];

  let isFirstEntropyWallet = true;

  Object.values(wallets).forEach((walletData) => {
    if (!walletData) {
      return;
    }

    const walletId = walletData.id;
    const isHardware = isHardwareWallet(walletData);
    const isImported = isImportedWallet(walletData);
    const isEntropy = walletData.type === AccountWalletType.Entropy;
    const isSnap = walletData.type === AccountWalletType.Snap;
    const isLocked = walletData.status === 'uninitialized';
    const rawEntropyId = extractRawEntropyId(walletId);

    const normalizedPrimaryEntropyId = primaryEntropySourceId
      ? extractRawEntropyId(primaryEntropySourceId)
      : undefined;

    // Check if this entropy wallet is removable (not primary)
    let isWalletRemovable = false;
    if (isEntropy) {
      if (normalizedPrimaryEntropyId && rawEntropyId) {
        isWalletRemovable = rawEntropyId !== normalizedPrimaryEntropyId;
      } else {
        // If no explicit primary entropy source is passed, treat the first one as primary
        isWalletRemovable = !isFirstEntropyWallet;
      }
      isFirstEntropyWallet = false;
    }

    const currentWalletAccounts: AccountManagementRowItem[] = [];

    Object.values(walletData.groups || {}).forEach((groupData) => {
      const groupId = groupData.id;
      const isHidden = Boolean(groupData.metadata?.hidden);
      // Hidden takes precedence over pinned
      const isPinned = !isHidden && Boolean(groupData.metadata?.pinned);

      const rowItem: AccountManagementRowItem = {
        id: `account-${groupId}`,
        groupId,
        groupData,
        walletId,
        walletName: walletData.metadata?.name,
        isPinned,
        isHidden,
        isLocked,
        isHardware,
        isImported,
        isRemovable: isImported, // Imported private key accounts are individually removable
      };

      if (isPinned) {
        pinnedAccounts.push(rowItem);
      } else if (isHardware) {
        hardwareAccounts.push(rowItem);
      } else if (isImported) {
        importedAccounts.push(rowItem);
      } else if (isEntropy) {
        currentWalletAccounts.push(rowItem);
      } else {
        currentWalletAccounts.push(rowItem);
      }
    });

    if (isEntropy) {
      if (currentWalletAccounts.length > 0 || !isLocked) {
        entropyWalletSections.push({
          id: `wallet-${walletId}`,
          title: walletData.metadata?.name || '',
          type: 'entropy-wallet',
          walletId,
          isCollapsible: true,
          isLocked,
          isRemovable: isWalletRemovable && !isLocked,
          canAddAccount: !isLocked,
          accounts: currentWalletAccounts,
        });
      }
    } else if (!isHardware && !isImported) {
      if (currentWalletAccounts.length > 0) {
        otherWalletSections.push({
          id: `wallet-${walletId}`,
          title: walletData.metadata?.name || '',
          type: isSnap ? 'snap' : 'other',
          walletId,
          isCollapsible: true,
          isLocked,
          isRemovable: false,
          canAddAccount: false,
          accounts: currentWalletAccounts,
        });
      }
    }
  });

  const sections: AccountManagementSection[] = [];

  // 1. Pinned section
  if (pinnedAccounts.length > 0) {
    sections.push({
      id: 'pinned',
      title: 'Pinned',
      titleKey: 'pinned',
      type: 'pinned',
      isCollapsible: true,
      accounts: pinnedAccounts,
    });
  }

  // 2. Entropy wallet sections
  sections.push(...entropyWalletSections);

  // 3. Hardware wallets section
  if (hardwareAccounts.length > 0) {
    sections.push({
      id: 'hardware-wallets',
      title: 'Hardware',
      titleKey: 'hardware',
      type: 'hardware',
      isCollapsible: true,
      isRemovable: true,
      accounts: hardwareAccounts,
    });
  }

  // 4. Imported accounts section
  if (importedAccounts.length > 0) {
    sections.push({
      id: 'imported-accounts',
      title: 'Imported',
      titleKey: 'imported',
      type: 'imported',
      isCollapsible: true,
      accounts: importedAccounts,
    });
  }

  // 5. Other / Snap wallets
  sections.push(...otherWalletSections);

  return sections;
}
