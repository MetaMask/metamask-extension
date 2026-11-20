import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonBase,
  Checkbox,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Tag,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { MultichainAccountCell } from '../../../../components/multichain-accounts/multichain-account-cell';
import { AccountTreeWallets } from '../../../../selectors/multichain-accounts/account-tree.types';
import { selectBalanceForAllWallets } from '../../../../selectors/assets';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getAccountGroupDisplayBalance } from '../../../../helpers/utils/account-group-balance';
import { VirtualizedList } from '../../../../components/ui/virtualized-list/virtualized-list';

type WalletGroupData =
  AccountTreeWallets[keyof AccountTreeWallets]['groups'][AccountGroupId];

const DEMO_ACCOUNT_BALANCES = [
  94857.55, 12500.25, 0, 4832.11, 250, 0, 1299.95, 45.8, 0, 312.42, 8720, 0,
  31.05, 650.34, 0, 20000, 95.12, 0, 741.8, 18.49,
];

type ListItem =
  | {
      type: 'divider';
      key: string;
    }
  | {
      type: 'wallet-header';
      key: string;
      walletId: string;
      walletName: string;
      accountCount: number;
      groupIds: AccountGroupId[];
      isExpanded: boolean;
    }
  | {
      type: 'account';
      key: string;
      walletId: string;
      groupId: AccountGroupId;
      groupData: WalletGroupData;
      avatarSeedAddress: string;
      demoBalance: number;
      isImported: boolean;
    };

export type WalletSelectionListProps = {
  wallets: AccountTreeWallets;
  importedAccountGroups?: AccountGroupId[];
  selectedAccountGroups: AccountGroupId[];
  onSelectionChange: (selected: AccountGroupId[]) => void;
};

export const WalletSelectionList = ({
  wallets,
  importedAccountGroups = [],
  selectedAccountGroups,
  onSelectionChange,
}: WalletSelectionListProps) => {
  const t = useI18nContext();
  const allBalances = useSelector(selectBalanceForAllWallets);
  const { formatCurrencyWithMinThreshold } = useFormatters();

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
  const importedSet = useMemo(
    () => new Set(importedAccountGroups),
    [importedAccountGroups],
  );

  const listData = useMemo(() => {
    const items: ListItem[] = [];

    Object.entries(wallets).forEach(([walletId, wallet], walletIndex) => {
      const groupIds = Object.keys(wallet.groups) as AccountGroupId[];
      const selectableGroupIds = groupIds.filter(
        (groupId) => !importedSet.has(groupId),
      );
      if (groupIds.length === 0) {
        return;
      }

      if (items.length > 0) {
        items.push({
          type: 'divider',
          key: `divider-${walletId}`,
        });
      }

      const isExpanded = !collapsedWallets.has(walletId);

      items.push({
        type: 'wallet-header',
        key: `wallet-${walletId}`,
        walletId,
        walletName: wallet.metadata?.name ?? '',
        accountCount: groupIds.length,
        groupIds: selectableGroupIds,
        isExpanded,
      });

      if (!isExpanded) {
        return;
      }

      groupIds.forEach((groupId, accountIndex) => {
        const avatarSeedNumber = walletIndex * 1000 + accountIndex + 1;
        const avatarSeedChunk = [
          avatarSeedNumber % 256,
          (avatarSeedNumber * 73) % 256,
        ]
          .map((value) => value.toString(16).padStart(2, '0'))
          .join('');

        items.push({
          type: 'account',
          key: `account-${groupId}`,
          walletId,
          groupId,
          groupData: wallet.groups[groupId],
          avatarSeedAddress: `0x${avatarSeedChunk.repeat(10)}`,
          demoBalance:
            DEMO_ACCOUNT_BALANCES[walletIndex * 10 + accountIndex] ?? 0,
          isImported: importedSet.has(groupId),
        });
      });
    });

    return items;
  }, [wallets, collapsedWallets, importedSet]);

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

  const toggleAccount = useCallback(
    (groupId: AccountGroupId) => {
      const next = new Set(selectedSet);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      onSelectionChange(Array.from(next));
    },
    [onSelectionChange, selectedSet],
  );

  const renderItem = useCallback(
    (info: { item: ListItem }) => {
      const { item } = info;
      if (item.type === 'divider') {
        return (
          <Box
            paddingHorizontal={4}
            paddingVertical={2}
            data-testid="qr-sync-wallet-divider"
          >
            <Box
              backgroundColor={BoxBackgroundColor.BackgroundMuted}
              className="h-px w-full"
            />
          </Box>
        );
      }

      if (item.type === 'wallet-header') {
        const allSelected = item.groupIds.every((id) => selectedSet.has(id));

        return (
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={3}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={4}
            paddingBottom={4}
            data-testid={`qr-sync-wallet-row-${item.walletId}`}
          >
            <Checkbox
              id={`wallet-select-${item.walletId}`}
              isSelected={allSelected}
              isDisabled={item.groupIds.length === 0}
              onChange={() => toggleWallet(item.groupIds)}
            />
            <ButtonBase
              onClick={() => toggleCollapsed(item.walletId)}
              className="h-auto min-w-0 flex-1 justify-between gap-3 bg-transparent p-0"
              aria-expanded={item.isExpanded}
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={2}
                className="min-w-0"
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextAlternative}
                  ellipsis
                >
                  {item.walletName}
                </Text>
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextAlternative}
                  className="shrink-0"
                >
                  (
                  {t(
                    item.accountCount === 1
                      ? 'qrSyncAccountCountOne'
                      : 'qrSyncAccountCount',
                    [item.accountCount],
                  )}
                  )
                </Text>
              </Box>
              <Icon
                name={item.isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
                size={IconSize.Md}
                color={IconColor.IconAlternative}
              />
            </ButtonBase>
          </Box>
        );
      }

      const groupBalance = getAccountGroupDisplayBalance(
        allBalances?.wallets?.[item.walletId]?.groups?.[item.groupId],
      );
      const balance = groupBalance
        ? formatCurrencyWithMinThreshold(
            groupBalance.amount,
            groupBalance.currency,
          )
        : formatCurrencyWithMinThreshold(item.demoBalance, 'USD');
      const isSelected = selectedSet.has(item.groupId);

      return (
        <Box
          style={{ opacity: item.isImported ? 0.5 : undefined }}
          aria-disabled={item.isImported || undefined}
          className="[&_.multichain-account-cell]:!py-3"
          data-testid={`qr-sync-account-row-${item.groupId}`}
        >
          <MultichainAccountCell
            accountId={item.groupId}
            accountName={item.groupData.metadata.name}
            avatarSeedAddress={item.avatarSeedAddress}
            accountNameAccessory={
              item.isImported ? (
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  className="h-5 shrink-0"
                >
                  <Tag data-testid={`qr-sync-imported-tag-${item.groupId}`}>
                    {t('qrSyncAlreadyImported')}
                  </Tag>
                </Box>
              ) : undefined
            }
            accountNameString={item.groupData.metadata.name}
            balance={balance}
            selected={isSelected}
            onClick={
              item.isImported ? undefined : () => toggleAccount(item.groupId)
            }
            disableHoverEffect={item.isImported}
            startAccessory={
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                onClick={(event: React.MouseEvent) => event.stopPropagation()}
              >
                <Checkbox
                  id={`account-select-${item.groupId}`}
                  isSelected={item.isImported || isSelected}
                  isDisabled={item.isImported}
                  onChange={() => toggleAccount(item.groupId)}
                />
              </Box>
            }
          />
        </Box>
      );
    },
    [
      allBalances,
      formatCurrencyWithMinThreshold,
      selectedSet,
      t,
      toggleAccount,
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
