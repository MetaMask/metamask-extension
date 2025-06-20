import React, { useMemo } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { Box, ButtonLink, ButtonLinkSize, Text } from '../../component-library';
import {
  AlignItems,
  Display,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AccountListItem,
  AccountListItemMenuTypes,
} from '../../multichain/account-list-item';
import { ConsolidatedWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { matchesSearchPattern } from './utils';

export type MultichainAccountsTreeProps = {
  wallets: ConsolidatedWallets;
  allowedAccountTypes: string[];
  connectedSites: Record<string, { origin: string; iconUrl?: string }[]>;
  currentTabOrigin?: string;
  privacyMode?: boolean;
  accountTreeItemProps?: Record<string, unknown>;
  searchPattern?: string;
  selectedAccount: InternalAccount;
  onClose: () => void;
  onAccountTreeItemClick: (account: MergedInternalAccount) => void;
};

export const MultichainAccountsTree = ({
  wallets,
  allowedAccountTypes,
  connectedSites,
  currentTabOrigin,
  privacyMode,
  accountTreeItemProps,
  searchPattern,
  selectedAccount,
  onClose,
  onAccountTreeItemClick,
}: MultichainAccountsTreeProps) => {
  const accountsTree = useMemo(() => {
    return Object.entries(wallets).reduce(
      (allWallets, [walletId, walletData]) => {
        const walletName = walletData.metadata?.name;

        const walletHeader = (
          <Box
            key={`wallet-header-${walletId}`}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
            paddingLeft={4}
            paddingRight={4}
          >
            <Text
              variant={TextVariant.bodySm}
              fontWeight={FontWeight.Medium}
              color={TextColor.textAlternative}
            >
              {walletName}
            </Text>
            <ButtonLink
              size={ButtonLinkSize.Sm}
              color={TextColor.primaryDefault}
              fontWeight={FontWeight.Normal}
            >
              Details
            </ButtonLink>
          </Box>
        );

        // Process all groups in the wallet and collect its account items
        const groupsItems = Object.entries(walletData.groups || {}).flatMap(
          ([groupId, groupData]) => {
            // Filter accounts based on allowed types and the search pattern
            const filteredAccounts = groupData.accounts.filter((account) => {
              const matchesSearch = searchPattern
                ? matchesSearchPattern(searchPattern, account)
                : true;
              const isAllowedType = allowedAccountTypes.includes(account.type);
              return matchesSearch && isAllowedType;
            });

            if (filteredAccounts.length === 0) {
              return [];
            }

            // Create account items for group
            const accountItems = filteredAccounts.map((account) => {
              const connectedSite = connectedSites[account.address]?.find(
                ({ origin }) => origin === currentTabOrigin,
              );

              return (
                <Box
                  className="multichain-account-menu-popover__list--menu-item"
                  key={`box-${account.id}`}
                >
                  <AccountListItem
                    onClick={onAccountTreeItemClick}
                    account={account}
                    key={`account-list-item-${account.id}`}
                    selected={selectedAccount.id === account.id}
                    closeMenu={onClose}
                    connectedAvatar={connectedSite?.iconUrl}
                    menuType={AccountListItemMenuTypes.Account}
                    currentTabOrigin={currentTabOrigin}
                    isActive={account.active}
                    privacyMode={privacyMode}
                    showSrpPill={false}
                    {...accountTreeItemProps}
                  />
                </Box>
              );
            });

            return [
              <Box
                key={`account-group-${groupId}`}
                style={{
                  borderBottom: '1px solid var(--color-border-muted)',
                }}
              >
                {accountItems}
              </Box>,
            ];
          },
        );

        // Skip adding wallet if no groupsItems exist
        if (groupsItems.length === 0) {
          return allWallets;
        }

        return [...allWallets, walletHeader, ...groupsItems];
      },
      [] as React.ReactNode[],
    );
  }, [
    wallets,
    searchPattern,
    allowedAccountTypes,
    connectedSites,
    onClose,
    currentTabOrigin,
    privacyMode,
    accountTreeItemProps,
    selectedAccount,
    onAccountTreeItemClick,
  ]);

  return <>{accountsTree}</>;
};
