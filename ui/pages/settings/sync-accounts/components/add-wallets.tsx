import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AccountGroupId,
  AccountWalletId,
  AccountWalletType,
} from '@metamask/account-api';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Button,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getAccountTree } from '../../../../selectors/multichain-accounts/account-tree';
import type { AccountTreeWallets } from '../../../../selectors/multichain-accounts/account-tree.types';
import { ScrollContainer } from '../../../../contexts/scroll-container';
import type { AddDeviceSyncRequest } from '../types';
import { filterSyncableWallets } from '../utils';
import { WalletSelectionList } from './wallet-selection-list';

const DEMO_ACCOUNTS_PER_WALLET = 10;
const DEMO_WALLET_COUNT = 2;
const DEMO_IMPORTED_ACCOUNT_NUMBERS = new Set([12, 17]);

type AddWalletsProps = {
  onAddWallets: (syncRequest: AddDeviceSyncRequest) => Promise<void>;
};

const createDemoWallets = (
  wallets: AccountTreeWallets,
): {
  wallets: AccountTreeWallets;
  importedAccountGroupIds: AccountGroupId[];
  sourceAccountGroupIdsByDemoId: Map<AccountGroupId, AccountGroupId>;
} => {
  const sourceWallets = Object.values(wallets);
  const fallbackWallet =
    sourceWallets.find((wallet) => wallet.type === AccountWalletType.Entropy) ??
    sourceWallets[0];
  const fallbackGroups = fallbackWallet
    ? Object.values(fallbackWallet.groups)
    : [];

  if (!fallbackWallet || fallbackGroups.length === 0) {
    return {
      wallets: {},
      importedAccountGroupIds: [],
      sourceAccountGroupIdsByDemoId: new Map(),
    };
  }

  const importedAccountGroupIds: AccountGroupId[] = [];
  const sourceAccountGroupIdsByDemoId = new Map<
    AccountGroupId,
    AccountGroupId
  >();
  const demoWallets = Object.fromEntries(
    Array.from({ length: DEMO_WALLET_COUNT }, (_wallet, walletIndex) => {
      const candidateWallet =
        sourceWallets[walletIndex % sourceWallets.length] ?? fallbackWallet;
      const templateWallet =
        Object.keys(candidateWallet.groups).length > 0
          ? candidateWallet
          : fallbackWallet;
      const templateGroups = Object.values(templateWallet.groups);
      const walletId =
        `${templateWallet.id}-qr-sync-demo-${walletIndex + 1}` as AccountWalletId;
      const groups = Object.fromEntries(
        Array.from(
          { length: DEMO_ACCOUNTS_PER_WALLET },
          (_account, accountIndex) => {
            const accountNumber =
              walletIndex * DEMO_ACCOUNTS_PER_WALLET + accountIndex + 1;
            const groupId = `${walletId}/${accountIndex}` as AccountGroupId;
            const templateGroup =
              templateGroups[accountIndex % templateGroups.length];
            sourceAccountGroupIdsByDemoId.set(groupId, templateGroup.id);

            if (DEMO_IMPORTED_ACCOUNT_NUMBERS.has(accountNumber)) {
              importedAccountGroupIds.push(groupId);
            }

            return [
              groupId,
              {
                ...templateGroup,
                id: groupId,
                metadata: {
                  ...templateGroup.metadata,
                  name: `Account ${accountNumber}`,
                },
              },
            ];
          },
        ),
      );

      return [
        walletId,
        {
          ...templateWallet,
          id: walletId,
          metadata: {
            ...templateWallet.metadata,
            name: `Wallet ${walletIndex + 1}`,
          },
          groups,
        },
      ];
    }),
  ) as AccountTreeWallets;

  return {
    wallets: demoWallets,
    importedAccountGroupIds,
    sourceAccountGroupIdsByDemoId,
  };
};

const AddWallets = ({ onAddWallets }: AddWalletsProps) => {
  const t = useI18nContext();
  const { wallets } = useSelector(getAccountTree);

  const syncableWallets = useMemo(
    () => filterSyncableWallets(wallets),
    [wallets],
  );

  const {
    wallets: demoWallets,
    importedAccountGroupIds,
    sourceAccountGroupIdsByDemoId,
  } = useMemo(() => createDemoWallets(syncableWallets), [syncableWallets]);

  // Show entropy wallets first and imported wallets last, while
  // preserving the relative order within each group.
  const sortedWallets = useMemo(() => {
    return Object.fromEntries(
      Object.entries(demoWallets).sort(([, a], [, b]) => {
        const rank = (type: string) =>
          type === AccountWalletType.Entropy ? 0 : 1;
        return rank(a.type) - rank(b.type);
      }),
    );
  }, [demoWallets]);

  const importedAccountGroupSet = useMemo(
    () => new Set(importedAccountGroupIds),
    [importedAccountGroupIds],
  );

  const [selectedAccountGroups, setSelectedAccountGroups] = useState<
    AccountGroupId[]
  >(() =>
    Object.values(sortedWallets).flatMap((wallet) =>
      (Object.keys(wallet.groups) as AccountGroupId[]).filter(
        (groupId) => !importedAccountGroupSet.has(groupId),
      ),
    ),
  );

  const selectedWalletCount = useMemo(() => {
    const selectedGroupIds = new Set(selectedAccountGroups);
    return Object.values(sortedWallets).filter((wallet) =>
      Object.keys(wallet.groups).some((groupId) =>
        selectedGroupIds.has(groupId as AccountGroupId),
      ),
    ).length;
  }, [selectedAccountGroups, sortedWallets]);

  let selectionSummaryKey = 'qrSyncSelectionSummary';
  if (selectedWalletCount === 1 && selectedAccountGroups.length === 1) {
    selectionSummaryKey = 'qrSyncSelectionSummaryOneWalletOneAccount';
  } else if (selectedWalletCount === 1) {
    selectionSummaryKey = 'qrSyncSelectionSummaryOneWallet';
  } else if (selectedAccountGroups.length === 1) {
    selectionSummaryKey = 'qrSyncSelectionSummaryOneAccount';
  }

  const handleSyncWallets = useCallback(async () => {
    const selectedAccountGroupCounts: Partial<Record<AccountGroupId, number>> =
      {};
    selectedAccountGroups.forEach((groupId) => {
      const sourceGroupId = sourceAccountGroupIdsByDemoId.get(groupId);
      if (sourceGroupId) {
        selectedAccountGroupCounts[sourceGroupId] =
          (selectedAccountGroupCounts[sourceGroupId] ?? 0) + 1;
      }
    });
    const selectedSourceAccountGroupIds = Object.keys(
      selectedAccountGroupCounts,
    ) as AccountGroupId[];
    const selectedGroupIds = new Set(selectedAccountGroups);
    const importSummary = {
      wallets: Object.values(sortedWallets)
        .map((wallet) => ({
          id: wallet.id,
          name: wallet.metadata?.name ?? '',
          accounts: Object.values(wallet.groups)
            .filter((group) => selectedGroupIds.has(group.id))
            .map((group) => ({
              id: group.id,
              name: group.metadata.name,
            })),
        }))
        .filter((wallet) => wallet.accounts.length > 0),
    };

    await onAddWallets({
      selectedAccountGroupIds: selectedSourceAccountGroupIds,
      selectedAccountGroupCounts,
      importSummary,
      syncedAccountCount: selectedAccountGroups.length,
      syncedWalletCount: selectedWalletCount,
    });
  }, [
    onAddWallets,
    selectedAccountGroups,
    selectedWalletCount,
    sourceAccountGroupIdsByDemoId,
    sortedWallets,
  ]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="-mx-4 flex-1 min-h-0"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={1}
        paddingHorizontal={4}
      >
        <Text
          variant={TextVariant.HeadingLg}
          fontWeight={FontWeight.Bold}
          color={TextColor.TextDefault}
        >
          {t('add_wallets')}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('add_wallets_desc')}
        </Text>
      </Box>
      <ScrollContainer className="mt-4 flex flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <WalletSelectionList
          wallets={sortedWallets}
          importedAccountGroups={importedAccountGroupIds}
          selectedAccountGroups={selectedAccountGroups}
          onSelectionChange={setSelectedAccountGroups}
        />
      </ScrollContainer>
      <Box
        className="w-full mt-auto flex-shrink-0"
        paddingHorizontal={4}
        paddingTop={3}
        paddingBottom={4}
        flexDirection={BoxFlexDirection.Column}
        gap={3}
        data-testid="qr-sync-selection-footer"
      >
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="text-center"
          data-testid="qr-sync-selection-summary"
        >
          {t(selectionSummaryKey, [
            selectedWalletCount,
            selectedAccountGroups.length,
          ])}
        </Text>
        <Button
          className="w-full"
          onClick={handleSyncWallets}
          isDisabled={selectedAccountGroups.length === 0}
          data-testid="qr-sync-sync-button"
        >
          {t('qrSyncImportAccountsCta')}
        </Button>
      </Box>
    </Box>
  );
};
export default AddWallets;
