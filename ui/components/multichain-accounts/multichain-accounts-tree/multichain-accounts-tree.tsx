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
import { ConsolidatedWallets } from '../../../selectors/multichain-accounts/multichain-accounts-selectors.types';
import { MergedInternalAccount } from '../../../selectors/selectors.types';

export type MultichainAccountsTreeProps = {
  walletAccountCollection: ConsolidatedWallets;
  allowedAccountTypes: string[];
  connectedSites: Record<string, { origin: string; iconUrl?: string }[]>;
  currentTabOrigin?: string;
  privacyMode?: boolean;
  accountListItemProps?: Record<string, unknown>;
  selectedAccount: InternalAccount;
  onClose: () => void;
  onAccountListItemItemClicked: (account: MergedInternalAccount) => void;
};

export const MultichainAccountsTree = ({
  walletAccountCollection,
  allowedAccountTypes,
  connectedSites,
  currentTabOrigin,
  privacyMode,
  accountListItemProps,
  selectedAccount,
  onClose,
  onAccountListItemItemClicked,
}: MultichainAccountsTreeProps) => {
  const accountsTree = useMemo(() => {
    return Object.entries(walletAccountCollection).reduce(
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
            // Filter accounts by allowed types
            const filteredAccounts = groupData.accounts.filter((account) =>
              allowedAccountTypes.includes(account.type),
            );

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
                    onClick={onAccountListItemItemClicked}
                    account={account}
                    key={`account-list-item-${account.id}`}
                    selected={selectedAccount.id === account.id}
                    closeMenu={onClose}
                    connectedAvatar={connectedSite?.iconUrl}
                    menuType={AccountListItemMenuTypes.Account}
                    currentTabOrigin={currentTabOrigin}
                    privacyMode={privacyMode}
                    showSrpPill={false}
                    {...accountListItemProps}
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

        return [...allWallets, walletHeader, ...groupsItems];
      },
      [] as React.ReactNode[],
    );
  }, [
    walletAccountCollection,
    allowedAccountTypes,
    connectedSites,
    currentTabOrigin,
    privacyMode,
    accountListItemProps,
    selectedAccount,
    onClose,
    onAccountListItemItemClicked,
  ]);

  return <>{accountsTree}</>;
};
