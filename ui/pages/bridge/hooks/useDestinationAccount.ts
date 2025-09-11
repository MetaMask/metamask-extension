import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  getAccountGroupNameByInternalAccount,
  getToChain,
} from '../../../ducks/bridge/selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import type { DestinationAccount } from '../prepare/types';

/**
 * Hook to provide the default internal destination account for a bridge quote
 *
 * @returns The default destination account and the setter for the selected destination account.
 */
export const useDestinationAccount = () => {
  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<DestinationAccount | null>(null);
  const toChain = useSelector(getToChain);

  // For bridges, use the appropriate account type for the destination chain
  const defaultInternalDestinationAccount = useSelector((state) =>
    toChain?.chainId
      ? getInternalAccountBySelectedAccountGroupAndCaip(
          state,
          formatChainIdToCaip(toChain.chainId),
        )
      : null,
  );

  const displayName = useSelector((state) =>
    getAccountGroupNameByInternalAccount(
      state,
      defaultInternalDestinationAccount,
    ),
  );

  useEffect(() => {
    setSelectedDestinationAccount(
      defaultInternalDestinationAccount
        ? {
            ...defaultInternalDestinationAccount,
            isExternal: false,
            displayName: displayName ?? '',
          }
        : null,
    );
  }, [defaultInternalDestinationAccount, displayName]);

  return { selectedDestinationAccount, setSelectedDestinationAccount };
};
