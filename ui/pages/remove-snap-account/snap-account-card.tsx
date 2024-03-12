import React from 'react';
import { useSelector } from 'react-redux';
import {
  getInternalAccounts,
  getMetaMaskAccountsOrdered,
  getSelectedNetworkClientId,
} from '../../selectors';
import { BlockSize, BorderRadius } from '../../helpers/constants/design-system';
import { Box } from '../../components/component-library';
import { AccountListItem } from '../../components/multichain';
import { mergeAccounts } from '../../components/multichain/account-list-menu/account-list-menu';
import usePolling from '../../hooks/usePolling';
import {
  currencyRateStartPollingByNetworkClientId,
  currencyRateStopPollingByPollingToken,
} from '../../store/actions';

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
  const identity = mergedAccounts.find(
    (account: { address: string }) => account.address === address,
  );

  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);
  usePolling({
    startPollingByNetworkClientId: currencyRateStartPollingByNetworkClientId,
    stopPollingByPollingToken: currencyRateStopPollingByPollingToken,
    networkClientId: selectedNetworkClientId,
  });

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
