import React, { useMemo } from 'react';

import { AccountGroupId } from '@metamask/account-api';
import { useDispatch } from 'react-redux';
import { Box, Text } from '../../component-library';

import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { MultichainAccountCell } from '../multichain-account-cell';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { setSelectedMultichainAccount } from '../../../store/actions';

export type MultichainAccountListProps = {
  wallets: AccountTreeWallets;
  selectedAccountGroup: AccountGroupId;
};

export const MultichainAccountList = ({
  wallets,
  selectedAccountGroup,
}: MultichainAccountListProps) => {
  const dispatch = useDispatch();

  const handleAccountClick = (accountGroupId: AccountGroupId) => {
    dispatch(setSelectedMultichainAccount(accountGroupId));
  };

  const walletTree = useMemo(() => {
    return Object.entries(wallets).reduce(
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
            paddingTop={2}
            paddingBottom={2}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textMuted}
              style={{ fontWeight: '600' }}
            >
              {walletName}
            </Text>
          </Box>
        );

        const groupsItems = Object.entries(walletData.groups || {}).flatMap(
          ([groupId, groupData]) => {
            return [
              <MultichainAccountCell
                key={`multichain-account-cell-${groupId}`}
                accountId={groupId as AccountGroupId}
                accountName={groupData.metadata.name}
                balance="$ n/a"
                selected={selectedAccountGroup === groupId}
                onClick={handleAccountClick}
              />,
            ];
          },
        );

        return [...walletsAccumulator, walletHeader, ...groupsItems];
      },
      [] as React.ReactNode[],
    );
  }, [wallets, selectedAccountGroup]);

  return <>{walletTree}</>;
};
