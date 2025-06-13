import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
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
  selectedAccount: { address: string };
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
  const accountListItems = useMemo(() => {
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
                  key={account.address}
                >
                  <AccountListItem
                    onClick={onAccountListItemItemClicked}
                    account={account}
                    key={account.address}
                    selected={selectedAccount.address === account.address}
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
                key={`group-${groupId}`}
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

  return <>{accountListItems}</>;
};

MultichainAccountsTree.propTypes = {
  /**
   * Collection of wallets with account metadata
   */
  walletAccountCollection: PropTypes.object.isRequired,

  /**
   * Array of account types allowed to be rendered
   */
  allowedAccountTypes: PropTypes.array.isRequired,

  /**
   * Mapping of account addresses to connected sites
   */
  connectedSites: PropTypes.object.isRequired,

  /**
   * Origin of the current tab
   */
  currentTabOrigin: PropTypes.string,

  /**
   * Whether privacy mode is enabled
   */
  privacyMode: PropTypes.bool,

  /**
   * Additional props to pass to the AccountListItem component
   */
  accountListItemProps: PropTypes.object,

  /**
   * Currently selected account
   */
  selectedAccount: PropTypes.shape({
    address: PropTypes.string.isRequired,
  }).isRequired,

  /**
   * Function to call when closing the menu
   */
  onClose: PropTypes.func.isRequired,

  /**
   * Function to call when an account list item is clicked
   */
  onAccountListItemItemClicked: PropTypes.func.isRequired,
};
