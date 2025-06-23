import React from 'react';
import { useSelector } from 'react-redux';
import { getMetaMaskAccountsOrdered } from '../../selectors';
import { BlockSize, BorderRadius } from '../../helpers/constants/design-system';
import { Box } from '../../components/component-library';
import { AccountListItem } from '../../components/multichain/account-list-item';
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
  const account = accounts.find(
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
      {/* TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880 */}
      {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
      <AccountListItem account={account} selected={remove || false} />
    </Box>
  );
};
