import React from 'react';
import { useSelector } from 'react-redux';
import {
  getInternalAccounts,
  getMetaMaskAccountsOrdered,
} from '../../selectors';
import { BlockSize, BorderRadius } from '../../helpers/constants/design-system';
import { Box } from '../../components/component-library';
import { AccountListItem } from '../../components/multichain';
import { mergeAccounts } from '../../components/multichain/account-list-menu/account-list-menu';
import { MergedInternalAccount } from '../../selectors/selectors.types';

// Wrapper component of AccountListItem with proper styling and auto populating information for the selected account
export const SnapAccountCard = ({
  address,
  remove,
}: {
  address: string;
  remove?: boolean;
}) => {
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const internalAccounts = useSelector(getInternalAccounts);
  // We should stop using mergeAccounts and write a new selector instead
  const mergedAccounts = mergeAccounts(accounts, internalAccounts);
  const account = mergedAccounts.find(
    (internalAccount: { address: string }) =>
      internalAccount.address === address,
  ) as MergedInternalAccount;

  return (
    <Box
      className={remove ? 'snap-account-card-remove' : 'snap-account-card'}
      borderRadius={BorderRadius.LG}
      marginTop={4}
      marginBottom={4}
      width={BlockSize.Full}
      style={{
        boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
      }}
    >
      <AccountListItem account={account} selected={remove || false} />
    </Box>
  );
};
