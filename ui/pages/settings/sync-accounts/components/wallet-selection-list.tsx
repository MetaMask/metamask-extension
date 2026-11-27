import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
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
import { getShowDefaultAddressPreference } from '../../../../selectors';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getAccountGroupDisplayBalance } from '../../../../helpers/utils/account-group-balance';
import { VirtualizedList } from '../../../../components/ui/virtualized-list/virtualized-list';
import { isPrivateKeyWallet } from '../utils';

type WalletGroupData =
  AccountTreeWallets[keyof AccountTreeWallets]['groups'][AccountGroupId];

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
      groupIds: AccountGroupId[];
      isExpanded: boolean;
    }
  | {
      type: 'account';
      key: string;
      walletId: string;
      groupId: AccountGroupId;
      groupData: WalletGroupData;
      /**
       * Whether this account can be selected on its own. Only imported
       * private-key accounts can. Accounts in other wallets are synced as part
       * of the whole wallet.
       */
      isSelectable: boolean;
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
  const t = useI18nContext();
  const allBalances = useSelector(selectBalanceForAllWallets);
  const { formatCurrencyWithMinThreshold } = useFormatters();
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
        groupIds,
        isExpanded,
      });

      if (!isExpanded) {
        return;
      }

      const isSelectable = isPrivateKeyWallet(wallet);

      groupIds.forEach((groupId) => {
        items.push({
          type: 'account',
          key: `account-${groupId}`,
          walletId,
          groupId,
          groupData: wallet.groups[groupId],
          isSelectable,
        });
      });
    });

    return items;
  }, [wallets, collapsedWallets]);

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
            paddingTop={2}
            paddingBottom={2}
            data-testid={`qr-sync-wallet-row-${item.walletId}`}
          >
            <Checkbox
              id={`wallet-select-${item.walletId}`}
              isSelected={allSelected}
              onChange={() => toggleWallet(item.groupIds)}
            />
            <Box asChild className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => toggleCollapsed(item.walletId)}
                className="flex w-full items-center justify-between gap-3"
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
                      item.groupIds.length === 1
                        ? 'qrSyncAccountCountOne'
                        : 'qrSyncAccountCount',
                      [item.groupIds.length],
                    )}
                    )
                  </Text>
                </Box>
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

      // Undefined when this group has no known balance yet, so the cell renders
      // nothing instead of a misleading "$0.00".
      const groupBalance = getAccountGroupDisplayBalance(
        allBalances?.wallets?.[item.walletId]?.groups?.[item.groupId],
      );
      const balance =
        groupBalance &&
        formatCurrencyWithMinThreshold(
          groupBalance.amount,
          groupBalance.currency,
        );

      if (!item.isSelectable) {
        // Part of a whole wallet: shown for context, selected with the wallet.
        return (
          <Box
            className="[&_.multichain-account-cell]:!py-3"
            data-testid={`qr-sync-account-row-${item.groupId}`}
          >
            <MultichainAccountCell
              accountId={item.groupId}
              accountName={item.groupData.metadata.name}
              accountNameString={item.groupData.metadata.name}
              balance={balance}
              showDefaultAddress={showDefaultAddress}
            />
          </Box>
        );
      }

      const isSelected = selectedSet.has(item.groupId);

      return (
        <Box
          className="[&_.multichain-account-cell]:!py-3"
          data-testid={`qr-sync-account-row-${item.groupId}`}
        >
          <MultichainAccountCell
            accountId={item.groupId}
            accountName={item.groupData.metadata.name}
            accountNameString={item.groupData.metadata.name}
            balance={balance}
            selected={isSelected}
            onClick={() => toggleAccount(item.groupId)}
            showDefaultAddress={showDefaultAddress}
            startAccessory={
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                onClick={(event: React.MouseEvent) => event.stopPropagation()}
              >
                <Checkbox
                  id={`account-select-${item.groupId}`}
                  isSelected={isSelected}
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
      showDefaultAddress,
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
