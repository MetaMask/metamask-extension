import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId, AccountWalletType } from '@metamask/account-api';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Checkbox,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { MultichainAccountCell } from '../../../../components/multichain-accounts/multichain-account-cell';
import { AccountTreeWallets } from '../../../../selectors/multichain-accounts/account-tree.types';
import { selectBalanceForAllWallets } from '../../../../selectors/assets';
import {
  getIsDefaultAddressEnabled,
  getShowDefaultAddressPreference,
} from '../../../../selectors';
import { useFormatters } from '../../../../hooks/useFormatters';
import { VirtualizedList } from '../../../../components/ui/virtualized-list/virtualized-list';

type WalletGroupData =
  AccountTreeWallets[keyof AccountTreeWallets]['groups'][AccountGroupId];

type ListItem =
  | {
      type: 'wallet-header';
      key: string;
      walletId: string;
      walletName: string;
      groupIds: AccountGroupId[];
      isExpanded: boolean;
    }
  | {
      type: 'account';
      key: string;
      walletId: string;
      groupId: AccountGroupId;
      groupData: WalletGroupData;
      selectable: boolean;
    };

export type WalletSelectionListProps = {
  wallets: AccountTreeWallets;
  selectedAccountGroups: AccountGroupId[];
  onSelectionChange: (selected: AccountGroupId[]) => void;
};

export const WalletSelectionList = ({
  wallets,
  selectedAccountGroups,
  onSelectionChange,
}: WalletSelectionListProps) => {
  const allBalances = useSelector(selectBalanceForAllWallets);
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const isDefaultAddressEnabled = useSelector(getIsDefaultAddressEnabled);
  const showDefaultAddress = useSelector(getShowDefaultAddressPreference);

  const [collapsedWallets, setCollapsedWallets] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleCollapsed = useCallback((walletId: string) => {
    setCollapsedWallets((prev) => {
      const next = new Set(prev);
      if (next.has(walletId)) {
        next.delete(walletId);
      } else {
        next.add(walletId);
      }
      return next;
    });
  }, []);

  const selectedSet = useMemo(
    () => new Set(selectedAccountGroups),
    [selectedAccountGroups],
  );

  const listData = useMemo(() => {
    const items: ListItem[] = [];

    Object.entries(wallets).forEach(([walletId, wallet]) => {
      const groupIds = Object.keys(wallet.groups) as AccountGroupId[];
      if (groupIds.length === 0) {
        return;
      }

      const isEntropyWallet = wallet.type === AccountWalletType.Entropy;
      const isExpanded = !collapsedWallets.has(walletId);

      items.push({
        type: 'wallet-header',
        key: `wallet-${walletId}`,
        walletId,
        walletName: wallet.metadata?.name ?? '',
        groupIds,
        isExpanded,
      });

      if (!isExpanded) {
        return;
      }

      groupIds.forEach((groupId) => {
        items.push({
          type: 'account',
          key: `account-${groupId}`,
          walletId,
          groupId,
          groupData: wallet.groups[groupId],
          selectable: !isEntropyWallet,
        });
      });
    });

    return items;
  }, [wallets, collapsedWallets]);

  const toggleGroup = useCallback(
    (groupId: AccountGroupId) => {
      const next = new Set(selectedSet);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      onSelectionChange(Array.from(next));
    },
    [selectedSet, onSelectionChange],
  );

  const toggleWallet = useCallback(
    (groupIds: AccountGroupId[]) => {
      const allSelected = groupIds.every((id) => selectedSet.has(id));
      const next = new Set(selectedSet);
      if (allSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      onSelectionChange(Array.from(next));
    },
    [selectedSet, onSelectionChange],
  );

  const renderItem = useCallback(
    (info: { item: ListItem }) => {
      const { item } = info;
      if (item.type === 'wallet-header') {
        const selectedCount = item.groupIds.filter((id) =>
          selectedSet.has(id),
        ).length;
        const allSelected =
          selectedCount > 0 && selectedCount === item.groupIds.length;
        const isIndeterminate = selectedCount > 0 && !allSelected;

        return (
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={3}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={2}
            paddingBottom={2}
          >
            <Checkbox
              id={`wallet-select-${item.walletId}`}
              isSelected={allSelected || isIndeterminate}
              checkedIconProps={
                isIndeterminate ? { name: IconName.MinusBold } : undefined
              }
              onChange={() => toggleWallet(item.groupIds)}
            />
            <Box asChild className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => toggleCollapsed(item.walletId)}
                className="flex w-full items-center justify-between gap-3"
                aria-expanded={item.isExpanded}
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextAlternative}
                  ellipsis
                >
                  {item.walletName}
                </Text>
                <Icon
                  name={item.isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
                  size={IconSize.Md}
                  color={IconColor.IconAlternative}
                />
              </button>
            </Box>
          </Box>
        );
      }

      const account =
        allBalances?.wallets?.[item.walletId]?.groups?.[item.groupId];
      const balance = account?.totalBalanceInUserCurrency ?? 0;
      const currency = account?.userCurrency ?? '';

      return (
        <MultichainAccountCell
          accountId={item.groupId}
          accountName={item.groupData.metadata.name}
          accountNameString={item.groupData.metadata.name}
          balance={formatCurrencyWithMinThreshold(balance, currency)}
          selected={false}
          showDefaultAddress={isDefaultAddressEnabled && showDefaultAddress}
          onClick={
            item.selectable ? () => toggleGroup(item.groupId) : undefined
          }
          startAccessory={
            item.selectable ? (
              <Box onClick={(event) => event.stopPropagation()}>
                <Checkbox
                  id={`account-select-${item.groupId}`}
                  isSelected={selectedSet.has(item.groupId)}
                  onChange={() => toggleGroup(item.groupId)}
                />
              </Box>
            ) : undefined
          }
        />
      );
    },
    [
      allBalances,
      formatCurrencyWithMinThreshold,
      isDefaultAddressEnabled,
      showDefaultAddress,
      selectedSet,
      toggleGroup,
      toggleWallet,
      toggleCollapsed,
    ],
  );

  return (
    <VirtualizedList
      data={listData}
      estimatedItemSize={64}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
    />
  );
};
