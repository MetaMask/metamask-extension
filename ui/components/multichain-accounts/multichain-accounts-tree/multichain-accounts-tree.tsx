import React, { useCallback, useMemo } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useNavigate } from 'react-router-dom-v5-compat';
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
import { HiddenAccountList } from '../../multichain/account-list-menu/hidden-account-list';
import { MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE } from '../../../helpers/constants/routes';
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
  const navigate = useNavigate();

  const handleWalletDetailsClick = useCallback(
    (walletId: string) => {
      navigate(
        `${MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE}/${encodeURIComponent(walletId)}`,
      );
      onClose();
    },
    [navigate, onClose],
  );

  const accountsTree = useMemo(() => {
    // We keep a flag to check if there are any hidden accounts
    let hasHiddenAccounts: boolean = false;

    const allWallets = Object.entries(wallets).reduce(
      (walletsAccumulator, [walletId, walletData]) => {
        const walletName = walletData.metadata?.name;

        const walletHeader = (
          <Box
            key={`wallet-header-${walletId}`}
            data-testid="multichain-account-tree-wallet-header"
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
              fontWeight={FontWeight.Medium}
              onClick={() => handleWalletDetailsClick(walletId)}
              style={{
                fontSize: '0.875rem',
              }}
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
              hasHiddenAccounts ||= account.hidden;

              return matchesSearch && isAllowedType && !account.hidden;
            });

            if (filteredAccounts.length === 0) {
              return [];
            }

            // Create account items for group
            const accountItems = filteredAccounts
              .sort((accountA, accountB) => {
                // Convert boolean values to numbers for sorting
                return Number(accountB.pinned) - Number(accountA.pinned);
              })
              .map((account) => {
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
                      isPinned={account.pinned}
                      showAccountLabels={false}
                      {...accountTreeItemProps}
                    />
                  </Box>
                );
              });

            return [
              <Box
                key={`account-group-${groupId}`}
                marginBottom={4}
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
          return walletsAccumulator;
        }

        return [...walletsAccumulator, walletHeader, ...groupsItems];
      },
      [] as React.ReactNode[],
    );

    // Add a final section for hidden accounts
    if (hasHiddenAccounts) {
      allWallets.push(<HiddenAccountList onClose={onClose} />);
    }

    return allWallets;
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
    handleWalletDetailsClick,
  ]);

  return <>{accountsTree}</>;
};
