import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId, AccountWalletType } from '@metamask/account-api';
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
import { ScrollContainer } from '../../../../contexts/scroll-container';
import type { AddDeviceSyncRequest } from '../types';
import { filterSyncableWallets, getSyncSummaryCounts } from '../utils';
import { WalletSelectionList } from './wallet-selection-list';

type AddWalletsProps = {
  onAddWallets: (syncRequest: AddDeviceSyncRequest) => Promise<void>;
};

const AddWallets = ({ onAddWallets }: AddWalletsProps) => {
  const t = useI18nContext();
  const { wallets } = useSelector(getAccountTree);

  const syncableWallets = useMemo(
    () => filterSyncableWallets(wallets),
    [wallets],
  );

  // Show entropy wallets first and imported wallets last, while
  // preserving the relative order within each group.
  const sortedWallets = useMemo(() => {
    return Object.fromEntries(
      Object.entries(syncableWallets).sort(([, a], [, b]) => {
        const rank = (type: string) =>
          type === AccountWalletType.Entropy ? 0 : 1;
        return rank(a.type) - rank(b.type);
      }),
    );
  }, [syncableWallets]);

  const [selectedAccountGroups, setSelectedAccountGroups] = useState<
    AccountGroupId[]
  >(() =>
    Object.values(sortedWallets).flatMap(
      (wallet) => Object.keys(wallet.groups) as AccountGroupId[],
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
    const { syncedAccountCount, syncedWalletCount } = getSyncSummaryCounts(
      sortedWallets,
      selectedAccountGroups,
    );

    await onAddWallets({
      selectedAccountGroupIds: selectedAccountGroups,
      syncedAccountCount,
      syncedWalletCount,
    });
  }, [onAddWallets, selectedAccountGroups, sortedWallets]);

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
