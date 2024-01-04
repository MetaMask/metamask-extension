import React from 'react';
import { useSelector } from 'react-redux';
import { getMetaMaskAccountsOrdered, mergeAccounts } from '../../selectors';
import { BlockSize, BorderRadius } from '../../helpers/constants/design-system';
import { Box } from '../../components/component-library';
import { AccountListItem } from '../../components/multichain';

// Wrapper component of AccountListItem with proper styling and auto populating information for the selected account
export const SnapAccountCard = ({
  address,
  remove,
}: {
  address: string;
  remove?: boolean;
}) => {
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const mergedAccounts = useSelector((state) => mergeAccounts(state, accounts));
  const identity = mergedAccounts.find(
    (account: { address: string }) => account.address === address,
  );

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
      <AccountListItem identity={identity} selected={remove} />
    </Box>
  );
};
