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
import { extractWalletIdFromGroupId } from '../../../../selectors/multichain-accounts/utils';
import { ScrollContainer } from '../../../../contexts/scroll-container';
import type { AddDeviceSyncRequest } from '../types';
import { filterSyncableWallets } from '../utils';
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

  const handleSyncWallets = useCallback(async () => {
    const selectedWalletIds = [
      ...new Set(
        selectedAccountGroups.map((accountGroupId) =>
          extractWalletIdFromGroupId(accountGroupId),
        ),
      ),
    ];

    await onAddWallets({
      selectedAccountGroupIds: selectedAccountGroups,
      syncedAccountCount: selectedAccountGroups.length,
      syncedWalletCount: selectedWalletIds.length,
    });
  }, [onAddWallets, selectedAccountGroups]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={4}
      className="flex-1 min-h-0"
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
      <ScrollContainer className="flex flex-1 flex-col overflow-y-auto mt-4">
        <WalletSelectionList
          wallets={sortedWallets}
          selectedAccountGroups={selectedAccountGroups}
          onSelectionChange={setSelectedAccountGroups}
        />
      </ScrollContainer>
      <Box className="w-full mt-auto" paddingHorizontal={4}>
        <Button
          className="w-full"
          onClick={handleSyncWallets}
          isDisabled={selectedAccountGroups.length === 0}
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
};
export default AddWallets;
