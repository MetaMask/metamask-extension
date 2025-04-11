// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { useSelector } from 'react-redux';

import { Box } from '../../components/component-library';
import { AccountListItem } from '../../components/multichain/account-list-item';
import { BlockSize, BorderRadius } from '../../helpers/constants/design-system';
import { getMetaMaskAccountsOrdered } from '../../selectors';
import type { MergedInternalAccount } from '../../selectors/selectors.types';

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
      {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880 */}
      <AccountListItem account={account} selected={remove || false} />
    </Box>
  );
};
